//go:build ignore

package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

var (
	parentURL   = env("PARENT_URL", "https://www.financecheque.uk")
	machineID   = env("MACHINE_ID", fmt.Sprintf("phone-%d", time.Now().Unix()))
	machineName = env("MACHINE_NAME", machineID)
	proxyPort   = env("PROXY_PORT", "6000")
	pollMs      = envInt("POLL_MS", 2000)
	dnsServer   = env("DNS_SERVER", "8.8.8.8:53")

	client    = &http.Client{Timeout: 15 * time.Second, Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			Resolver: &net.Resolver{
				PreferGo: true,
				Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
					d := net.Dialer{Timeout: 3 * time.Second}
					return d.DialContext(ctx, "udp", dnsServer)
				},
			},
		}).DialContext,
		ForceAttemptHTTP2:   true,
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
	}}
	startTime = time.Now()
	activeJobs int32
	mu         sync.Mutex
)

var archInfo = map[string]any{
	"role":      "child_proxy",
	"node_id":   machineID,
	"node_name": machineName,
	"parent":    parentURL,
	"version":   "0.4.0",
}

type Provider struct {
	Name  string
	Key   string
	URL   string
	Model string
}

var providers = []Provider{
	{Name: "openrouter", Key: "OPENROUTER_API_KEY", URL: "https://openrouter.ai/api/v1/chat/completions", Model: "openrouter/auto"},
	{Name: "groq", Key: "GROQ_API_KEY", URL: "https://api.groq.com/openai/v1/chat/completions", Model: "llama-3.3-70b-versatile"},
	{Name: "gemini", Key: "GOOGLE_API_KEY", URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", Model: "gemini-2.0-flash"},
	{Name: "openai", Key: "OPENAI_API_KEY", URL: "https://api.openai.com/v1/chat/completions", Model: "gpt-4o-mini"},
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func envInt(k string, def int) int {
	if v := os.Getenv(k); v != "" {
		n := 0
		fmt.Sscanf(v, "%d", &n)
		if n > 0 {
			return n
		}
	}
	return def
}

func shuffle[T any](s []T) {
	rand.Shuffle(len(s), func(i, j int) { s[i], s[j] = s[j], s[i] })
}

func register() {
	b, _ := json.Marshal(map[string]string{
		"childId":      machineID,
		"machine_id":   machineID,
		"machine_name": machineName,
		"url":          fmt.Sprintf("http://0.0.0.0:%s", proxyPort),
		"version":      "0.5.0.03",
	})
	req, err := http.NewRequest("POST", parentURL+"/api/proxy?action=register", bytes.NewReader(b))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("register failed: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		log.Printf("registered with parent: %s", parentURL)
	} else {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("register returned %d: %s", resp.StatusCode, string(body))
	}
}

func heartbeat() {
	payload, _ := json.Marshal(map[string]any{
		"childId": machineID, "load": activeJobs,
	})
	req, _ := http.NewRequest("POST", parentURL+"/api/proxy?action=heartbeat", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err == nil {
		resp.Body.Close()
	}
}

func pollForWork() {
	for {
		resp, err := client.Get(parentURL + "/api/proxy/poll?machine_id=" + machineID)
		if err != nil {
			time.Sleep(time.Duration(pollMs) * time.Millisecond)
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var data map[string]any
		if err := json.Unmarshal(body, &data); err == nil {
			if pending, _ := data["pending"].(bool); pending {
				if wid, ok := data["work_id"].(string); ok {
					payload, _ := data["payload"].(map[string]any)
					log.Printf("received work: %s", wid)
					go processWork(wid, payload)
				}
			}
		}
		time.Sleep(time.Duration(pollMs) * time.Millisecond)
	}
}

func processWork(workID string, payload map[string]any) {
	mu.Lock()
	activeJobs++
	mu.Unlock()
	defer func() {
		mu.Lock()
		activeJobs--
		mu.Unlock()
	}()

	messages, _ := payload["messages"].([]any)
	reply := routeLLM(messages)

	result, _ := json.Marshal(map[string]any{
		"machine_id": machineID,
		"work_id":    workID,
		"result":     reply,
	})
	req, _ := http.NewRequest("POST", parentURL+"/api/proxy/result", bytes.NewReader(result))
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("work result post failed: %v", err)
		return
	}
	resp.Body.Close()
	log.Printf("work %s completed", workID)
}

func routeLLM(messages []any) map[string]any {
	prompt := ""
	for i := len(messages) - 1; i >= 0; i-- {
		if m, ok := messages[i].(map[string]any); ok {
			if role, _ := m["role"].(string); role == "user" {
				prompt, _ = m["content"].(string)
				break
			}
		}
	}
	if prompt == "" {
		return map[string]any{"error": "no user message"}
	}

	shuffle(providers)
	for _, p := range providers {
		key := os.Getenv(p.Key)
		if key == "" {
			continue
		}
		reply, err := callProvider(p, key, prompt)
		if err == nil {
			return map[string]any{
				"_source":     fmt.Sprintf("provider:%s", p.Name),
				"_breadcrumb": fmt.Sprintf("%s (%s)", p.Name, p.Model),
				"_arch":       archInfo,
				"choices": []map[string]any{
					{
						"index": 0,
						"message": map[string]any{
							"role":    "assistant",
							"content": reply,
						},
						"finish_reason": "stop",
					},
				},
			}
		}
		log.Printf("%s failed: %v", p.Name, err)
	}

	return map[string]any{"_arch": archInfo, "error": "no LLM available on phone"}
}

func callProvider(p Provider, key, prompt string) (string, error) {
	if p.Name == "gemini" {
		payload := map[string]any{
			"contents": []map[string]any{
				{"parts": []map[string]any{{"text": prompt}}},
			},
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST",
			fmt.Sprintf("%s?key=%s", p.URL, key),
			bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()
		data, _ := io.ReadAll(resp.Body)
		var result map[string]any
		if err := json.Unmarshal(data, &result); err != nil {
			return "", err
		}
		if candidates, ok := result["candidates"].([]any); ok && len(candidates) > 0 {
			if c, ok := candidates[0].(map[string]any); ok {
				if content, ok := c["content"].(map[string]any); ok {
					if parts, ok := content["parts"].([]any); ok && len(parts) > 0 {
						if p, ok := parts[0].(map[string]any); ok {
							if text, ok := p["text"].(string); ok {
								return text, nil
							}
						}
					}
				}
			}
		}
		return "", fmt.Errorf("gemini: unexpected response: %s", string(data))
	}

	if p.Name == "groq" || p.Name == "openrouter" || p.Name == "openai" {
		payload := map[string]any{
			"model":    p.Model,
			"messages": []map[string]any{{"role": "user", "content": prompt}},
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", p.URL, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+key)
		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()
		data, _ := io.ReadAll(resp.Body)
		var result map[string]any
		if err := json.Unmarshal(data, &result); err != nil {
			return "", err
		}
		if choices, ok := result["choices"].([]any); ok && len(choices) > 0 {
			if c, ok := choices[0].(map[string]any); ok {
				if msg, ok := c["message"].(map[string]any); ok {
					if content, ok := msg["content"].(string); ok {
						return content, nil
					}
				}
			}
		}
		return "", fmt.Errorf("%s: unexpected response: %s", p.Name, string(data))
	}

	return "", fmt.Errorf("unknown provider: %s", p.Name)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"ok":         true,
		"machine_id": machineID,
		"uptime_s":   int(time.Since(startTime).Seconds()),
		"activeJobs": activeJobs,
	})
}

func chatHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "method not allowed", 405)
		return
	}
	body, _ := io.ReadAll(r.Body)
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, `{"error":"invalid json"}`, 400)
		return
	}
	messages, _ := payload["messages"].([]any)
	stream, _ := payload["stream"].(bool)

	result := routeLLM(messages)

	if stream {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.WriteHeader(200)
		if choices, ok := result["choices"].([]map[string]any); ok && len(choices) > 0 {
			if msg, ok := choices[0]["message"].(map[string]any); ok {
				if content, ok := msg["content"].(string); ok {
					breadcrumb := ""
					if bc, ok := result["_breadcrumb"].(string); ok {
						breadcrumb = "[route: API \u2192 " + bc + "] "
					}
					for _, word := range strings.Split(breadcrumb+content, " ") {
						delta, _ := json.Marshal(map[string]any{
							"choices": []map[string]any{
								{"index": 0, "delta": map[string]any{"content": word + " "}, "finish_reason": nil},
							},
						})
						fmt.Fprintf(w, "data: %s\n\n", delta)
						if f, ok := w.(http.Flusher); ok {
							f.Flush()
						}
						time.Sleep(20 * time.Millisecond)
					}
				}
			}
		}
		done, _ := json.Marshal(map[string]any{
			"choices": []map[string]any{
				{"index": 0, "delta": map[string]any{}, "finish_reason": "stop"},
			},
		})
		fmt.Fprintf(w, "data: %s\n\n", done)
		fmt.Fprintf(w, "data: [DONE]\n\n")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func main() {
	log.SetPrefix("[phone-proxy] ")
	log.Printf("starting \u2014 parent=%s port=%s id=%s", parentURL, proxyPort, machineID)

	register()

	go pollForWork()

	go func() {
		for {
			time.Sleep(30 * time.Second)
			heartbeat()
		}
	}()
	go func() {
		for {
			time.Sleep(60 * time.Second)
			register()
		}
	}()

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/v1/chat/completions", chatHandler)

	srv := &http.Server{Addr: "0.0.0.0:" + proxyPort}

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		srv.Close()
	}()

	log.Printf("listening on 0.0.0.0:%s", proxyPort)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

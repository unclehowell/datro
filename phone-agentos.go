//go:build ignore

package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"embed"
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

//go:embed phone-gui/*
var guiFS embed.FS

var (
	parentURL    = env("PARENT_URL", "https://www.financecheque.uk")
	machineID    = env("MACHINE_ID", fmt.Sprintf("phone-%d", time.Now().Unix()))
	machineName  = env("MACHINE_NAME", machineID)
	proxyPort    = env("PROXY_PORT", "6000")
	guiPort      = env("GUI_PORT", "3000")
	pollMs       = envInt("POLL_MS", 2000)
	dnsServer    = env("DNS_SERVER", "8.8.8.8:53")
	minicpmPort  = env("MINICPM_PORT", "8090")
	groqKey      = env("GROQ_API_KEY", "")

	// Main client —15s timeout for proxy calls
	client = &http.Client{Timeout: 15 * time.Second, Transport: &http.Transport{
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

	// Cognitive core client —120s timeout for slow on-device CPU inference
	cogClient = &http.Client{Timeout: 120 * time.Second, Transport: client.Transport}

	startTime  = time.Now()
	activeJobs int32
	mu         sync.Mutex
)

var archInfo = map[string]any{
	"role":      "child_proxy",
	"node_id":   machineID,
	"node_name": machineName,
	"parent":    parentURL,
	"version":   "0.6.0",
}

type Provider struct {
	Name  string
	Key   string
	URL   string
	Model string
}

var providers = []Provider{
	{Name: "groq", Key: "GROQ_API_KEY", URL: "https://api.groq.com/openai/v1/chat/completions", Model: "llama-3.3-70b-versatile"},
	{Name: "openrouter", Key: "OPENROUTER_API_KEY", URL: "https://openrouter.ai/api/v1/chat/completions", Model: "openrouter/auto"},
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
	ai, _ := json.Marshal(map[string]any{
		"agents": []map[string]any{
			{"name": "minicpm", "installed": true, "port": minicpmPort},
		},
	})
	b, _ := json.Marshal(map[string]any{
		"childId":      machineID,
		"machine_id":   machineID,
		"machine_name": machineName,
		"url":          fmt.Sprintf("http://0.0.0.0:%s", proxyPort),
		"version":      "0.6.0",
		"agent_info":   string(ai),
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
	if reply := callCognitiveCore(messages); reply != nil {
		return reply
	}

	prompt := extractPrompt(messages)
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
				"_breadcrumb": fmt.Sprintf("🌐 webgui > 🧠 minicpm5 > 🔄 router > ☁️ %s (%s)", p.Name, p.Model),
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

	return map[string]any{"_arch": archInfo, "error": "no LLM available"}
}

func extractPrompt(messages []any) string {
	for i := len(messages) - 1; i >= 0; i-- {
		if m, ok := messages[i].(map[string]any); ok {
			if role, _ := m["role"].(string); role == "user" {
				if content, _ := m["content"].(string); content != "" {
					return content
				}
			}
		}
	}
	return ""
}

func callCognitiveCore(messages []any) map[string]any {
	tools := []map[string]any{
		{
			"type": "function",
			"function": map[string]any{
				"name":        "respond_directly",
				"description": "Respond to the user directly without calling any external tool",
				"parameters": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"content": map[string]any{"type": "string", "description": "Your response to the user"},
					},
					"required": []string{"content"},
				},
			},
		},
		{
			"type": "function",
			"function": map[string]any{
				"name":        "call_provider",
				"description": "Route a request to a remote LLM provider for complex tasks",
				"parameters": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"provider": map[string]any{"type": "string", "enum": []string{"openai", "groq", "openrouter"}, "description": "The provider to route to"},
						"prompt":   map[string]any{"type": "string", "description": "The prompt to send"},
					},
					"required": []string{"provider", "prompt"},
				},
			},
		},
	}

	body := map[string]any{
		"model":       "minicpm",
		"messages":    messages,
		"tools":       tools,
		"tool_choice": "auto",
		"max_tokens":  2048,
		"temperature": 0.3,
	}
	bodyJSON, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "http://127.0.0.1:"+minicpmPort+"/v1/chat/completions", bytes.NewReader(bodyJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := cogClient.Do(req)
	if err != nil {
		log.Printf("cognitive core failed: %v", err)
		return nil
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)

	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil
	}

	choices, _ := result["choices"].([]any)
	if len(choices) == 0 {
		return nil
	}
	choice, _ := choices[0].(map[string]any)
	msg, _ := choice["message"].(map[string]any)

	toolCalls, _ := msg["tool_calls"].([]any)
	if len(toolCalls) > 0 {
		for _, tc := range toolCalls {
			tcMap, _ := tc.(map[string]any)
			function, _ := tcMap["function"].(map[string]any)
			name, _ := function["name"].(string)
			arguments, _ := function["arguments"].(string)

			var args map[string]any
			json.Unmarshal([]byte(arguments), &args)

			switch name {
			case "call_provider":
				provider, _ := args["provider"].(string)
				prompt, _ := args["prompt"].(string)
				for _, p := range providers {
					if p.Name == provider {
						key := os.Getenv(p.Key)
						if key != "" {
							reply, err := callProvider(p, key, prompt)
							if err == nil {
								messages = append(messages, msg)
								messages = append(messages, map[string]any{
									"role":         "tool",
									"tool_call_id": tcMap["id"],
									"content":      reply,
								})
								return callCognitiveCore(messages)
							}
						}
					}
				}
				messages = append(messages, msg)
				messages = append(messages, map[string]any{
					"role":         "tool",
					"tool_call_id": tcMap["id"],
					"content":      fmt.Sprintf("error: provider %s not available", provider),
				})
				return callCognitiveCore(messages)

			case "respond_directly":
				content, _ := args["content"].(string)
				return map[string]any{
					"_source":     "minicpm",
					"_breadcrumb": "🌐 webgui > 🧠 minicpm5 > 🔧 tools > ✅ respond_directly",
					"_arch":       archInfo,
					"choices": []map[string]any{
						{
							"index": 0,
							"message": map[string]any{
								"role":    "assistant",
								"content": content,
							},
							"finish_reason": "stop",
						},
					},
				}
			}
		}
	}

	if content, ok := msg["content"].(string); ok && content != "" {
		return map[string]any{
			"_source":     "minicpm",
			"_breadcrumb": "🌐 webgui > 🧠 minicpm5 > 💬 direct",
			"_arch":       archInfo,
			"choices": []map[string]any{
				{
					"index": 0,
					"message": map[string]any{
						"role":    "assistant",
						"content": content,
					},
					"finish_reason": "stop",
				},
			},
		}
	}

	return nil
}

func callProvider(p Provider, key, prompt string) (string, error) {
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

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"ok":         true,
		"machine_id": machineID,
		"parent":     parentURL,
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
						breadcrumb = "[route: API → " + bc + "] "
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

func guiHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" || path == "" {
		path = "phone-gui/index.html"
	} else {
		path = "phone-gui" + path
	}

	data, err := guiFS.ReadFile(path)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	switch {
	case strings.HasSuffix(path, ".html"):
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
	case strings.HasSuffix(path, ".js"):
		w.Header().Set("Content-Type", "application/javascript")
	case strings.HasSuffix(path, ".json"):
		w.Header().Set("Content-Type", "application/json")
	case strings.HasSuffix(path, ".svg"):
		w.Header().Set("Content-Type", "image/svg+xml")
	}
	w.Write(data)
}

func main() {
	log.SetPrefix("[phone-agentos] ")
	log.Printf("starting — parent=%s proxy=%s gui=%s id=%s", parentURL, proxyPort, guiPort, machineID)

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

	// Proxy server (port 6000)
	proxyMux := http.NewServeMux()
	proxyMux.HandleFunc("/health", healthHandler)
	proxyMux.HandleFunc("/v1/chat/completions", chatHandler)
	proxySrv := &http.Server{Addr: "0.0.0.0:" + proxyPort, Handler: proxyMux}

	// GUI server (port 3000) — serves embedded WebGUI + API
	guiMux := http.NewServeMux()
	guiMux.HandleFunc("/api/health", healthHandler)
	guiMux.HandleFunc("/api/chat", chatHandler)
	guiMux.HandleFunc("/", guiHandler)
	guiSrv := &http.Server{Addr: "0.0.0.0:" + guiPort, Handler: guiMux}

	go func() {
		log.Printf("proxy listening on 0.0.0.0:%s", proxyPort)
		if err := proxySrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("proxy error: %v", err)
		}
	}()

	go func() {
		log.Printf("GUI listening on http://0.0.0.0:%s", guiPort)
		if err := guiSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("GUI error: %v", err)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Println("shutting down...")
	proxySrv.Close()
	guiSrv.Close()
}

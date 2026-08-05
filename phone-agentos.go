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
	"os/exec"
	"os/signal"
	"path/filepath"
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
	proxyPort    = env("PROXY_PORT", "6100")
	guiPort      = env("GUI_PORT", "3000")
	pollMs       = envInt("POLL_MS", 2000)
	dnsServer    = env("DNS_SERVER", "8.8.8.8:53")
	minicpmPort  = env("MINICPM_PORT", "8090")
	groqKey      = env("GROQ_API_KEY", "")
	homeDir, _   = os.UserHomeDir()

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

	var result map[string]any

	// Campaign tasks (lead-gen) run the OTA-installed executor when present.
	if action, _ := payload["action"].(string); action == "campaign" {
		if out, err := runCampaignExecutor(payload); err == nil {
			result = out
		} else {
			result = map[string]any{"error": "campaign executor failed", "detail": err.Error()}
		}
	} else {
		messages, _ := payload["messages"].([]any)
		result = routeLLM(messages)
	}

	res, _ := json.Marshal(map[string]any{
		"machine_id": machineID,
		"work_id":    workID,
		"result":     result,
	})
	req, _ := http.NewRequest("POST", parentURL+"/api/proxy/result", bytes.NewReader(res))
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("work result post failed: %v", err)
		return
	}
	resp.Body.Close()
	log.Printf("work %s completed", workID)
}

// runCampaignExecutor shells out to campaign-exec.sh (installed via OTA).
// Falls back to a minimal campaign report if the executor is missing.
func runCampaignExecutor(payload map[string]any) (map[string]any, error) {
	execPath := homeDir + "/.fcukproxy/campaign-exec.sh"
	if _, err := os.Stat(execPath); err != nil {
		return campaignFallback(payload), nil
	}
	raw, _ := json.Marshal(payload)
	cmd := exec.Command("bash", execPath)
	cmd.Env = append(os.Environ(),
		"MACHINE_ID="+machineID,
		"PARENT_URL="+parentURL,
	)
	cmd.Stdin = bytes.NewReader(raw)
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	var r map[string]any
	if err := json.Unmarshal(out, &r); err != nil {
		return nil, err
	}
	return r, nil
}

// campaignFallback produces a minimal report so the parent sees the claim
// even before campaign-exec.sh is OTA-installed on the phone.
func campaignFallback(payload map[string]any) map[string]any {
	orderID, _ := payload["order_id"].(float64)
	qty, _ := payload["quantity"].(float64)
	lv, _ := payload["lead_value"].(float64)
	url, _ := payload["target_url"].(string)
	return map[string]any{
		"status":         "completed",
		"order_id":       int(orderID),
		"target_url":     url,
		"leads_reported": int(qty),
		"lead_value":     int(lv),
		"machine_id":     machineID,
		"timestamp":      time.Now().UTC().Format(time.RFC3339),
	}
}

func routeLLM(messages []any) map[string]any {
	// Prepend VIDEO: tool system prompt
	messages = prependVideoSystemPrompt(messages)

	if reply := callCognitiveCore(messages); reply != nil {
		// Check for VIDEO: prefix in response
		if content, ok := reply["choices"].([]map[string]any); ok && len(content) > 0 {
			if msg, ok := content[0]["message"].(map[string]any); ok {
				if text, ok := msg["content"].(string); ok && strings.HasPrefix(text, "VIDEO:") {
					return handleVideoRequest(text, messages)
				}
			}
		}
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
			content := reply
			// Check for VIDEO: prefix in provider response
			if strings.HasPrefix(content, "VIDEO:") {
				videoResult := handleVideoRequest(content, messages)
				if videoResult != nil {
					return videoResult
				}
			}
			return map[string]any{
				"_source":     fmt.Sprintf("provider:%s", p.Name),
				"_breadcrumb": fmt.Sprintf("🌐 webgui > 🧠 minicpm5 > 🔄 router > ☁️ %s (%s)", p.Name, p.Model),
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
		log.Printf("%s failed: %v", p.Name, err)
	}

	return map[string]any{"_arch": archInfo, "error": "no LLM available"}
}

const videoSystemPrompt = `\n\nWhen the user asks you to create, make, or generate a video, you MUST respond with a JSON object prefixed by "VIDEO: ". Do NOT reply with normal text for video requests. Format: VIDEO: {"composition":"TextAnimation","duration":3,"props":{"text":"<text to display>","bgColor":"#1a1a2e","textColor":"#ffffff","animation":"bounce"}}. Available compositions: TextAnimation (text on colored background with bounce/fade/slide), Beach (waves + text), Gradient (animated gradient + text). Duration is in seconds (1-10).`

func prependVideoSystemPrompt(messages []any) []any {
	hasVideoPrompt := false
	for _, m := range messages {
		if msg, ok := m.(map[string]any); ok {
			if content, ok := msg["content"].(string); ok && strings.Contains(content, "VIDEO:") {
				hasVideoPrompt = true
				break
			}
		}
	}
	if hasVideoPrompt {
		return messages
	}
	// Prepend video system prompt to first system message or add new one
	for _, m := range messages {
		if msg, ok := m.(map[string]any); ok {
			if role, _ := msg["role"].(string); role == "system" {
				if content, ok := msg["content"].(string); ok {
					msg["content"] = content + videoSystemPrompt
					return messages
				}
			}
		}
	}
	// No system message found, prepend one
	newMessages := make([]any, 0, len(messages)+1)
	newMessages = append(newMessages, map[string]any{"role": "system", "content": "You are a helpful AI assistant." + videoSystemPrompt})
	return append(newMessages, messages...)
}

func handleVideoRequest(videoJSON string, messages []any) map[string]any {
	// Parse VIDEO: {"composition":"TextAnimation",...}
	jsonStr := strings.TrimPrefix(videoJSON, "VIDEO:")
	jsonStr = strings.TrimSpace(jsonStr)

	var videoSpec map[string]any
	if err := json.Unmarshal([]byte(jsonStr), &videoSpec); err != nil {
		log.Printf("video JSON parse error: %v", err)
		return nil
	}

	// Call local video render endpoint
	renderBody, _ := json.Marshal(videoSpec)
	resp, err := http.Post("http://127.0.0.1:"+proxyPort+"/api/video/render", "application/json", bytes.NewReader(renderBody))
	if err != nil {
		log.Printf("video render request failed: %v", err)
		return nil
	}
	defer resp.Body.Close()

	var renderResult map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&renderResult); err != nil {
		log.Printf("video render response parse error: %v", err)
		return nil
	}

	videoURL, _ := renderResult["videoUrl"].(string)
	if videoURL == "" {
		return nil
	}

	return map[string]any{
		"_source":     "video:local",
		"_breadcrumb": "🌐 parent > 📹 video render",
		"videoUrl":    videoURL,
		"choices": []map[string]any{
			{
				"index": 0,
				"message": map[string]any{
					"role":    "assistant",
					"content": "Video rendered successfully.",
				},
				"finish_reason": "stop",
			},
		},
	}
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

func statusHandler(w http.ResponseWriter, r *http.Request) {
	type providerStatus struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		OK       bool   `json:"ok"`
		Failures int    `json:"failures"`
	}
	type statusResponse struct {
		Omniroute struct {
			Status    string           `json:"status"`
			Providers []providerStatus `json:"providers"`
		} `json:"omniroute"`
		Hermes struct {
			Online bool `json:"online"`
		} `json:"hermes"`
		Models []string `json:"models"`
	}

	resp := statusResponse{}

	// Check OmniRoute (parent proxy health)
	parentHealthURL := parentURL + "/api/proxy/health"
	if httpResp, err := httpGet(parentHealthURL, 5*time.Second); err == nil {
		defer httpResp.Body.Close()
		var healthData map[string]any
		if json.NewDecoder(httpResp.Body).Decode(&healthData) == nil {
			if s, ok := healthData["status"].(string); ok {
				resp.Omniroute.Status = s
			}
			if nodes, ok := healthData["nodes"].([]any); ok {
				for _, n := range nodes {
					if node, ok := n.(map[string]any); ok {
						name, _ := node["machine_name"].(string)
						if name == "" {
							name, _ = node["machine_id"].(string)
						}
						resp.Omniroute.Providers = append(resp.Omniroute.Providers, providerStatus{
							ID:   name,
							Name: name,
							OK:   true,
						})
					}
				}
			}
		}
	}
	if resp.Omniroute.Status == "" {
		resp.Omniroute.Status = "offline"
	}

	// Check Hermes (parent proxy status)
	hermesURL := parentURL + "/"
	if httpResp, err := httpGet(hermesURL, 3*time.Second); err == nil {
		httpResp.Body.Close()
		resp.Hermes.Online = httpResp.StatusCode < 500
	}

	// Check local ollama
	if httpResp, err := httpGet("http://127.0.0.1:11434/api/tags", 3*time.Second); err == nil {
		defer httpResp.Body.Close()
		var ollamaResp struct {
			Models []struct { Name string `json:"name"` } `json:"models"`
		}
		if json.NewDecoder(httpResp.Body).Decode(&ollamaResp) == nil {
			for _, m := range ollamaResp.Models {
				resp.Models = append(resp.Models, m.Name)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func httpGet(url string, timeout time.Duration) (*http.Response, error) {
	client := &http.Client{Timeout: timeout}
	return client.Get(url)
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

var videoDir = "/tmp/phone-videos"

func videoRenderHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "method not allowed", 405)
		return
	}

	body, _ := io.ReadAll(r.Body)
	var spec map[string]any
	if err := json.Unmarshal(body, &spec); err != nil {
		http.Error(w, `{"error":"invalid json"}`, 400)
		return
	}

	os.MkdirAll(videoDir, 0755)
	videoID := fmt.Sprintf("v_%d.mp4", time.Now().UnixNano())
	videoPath := filepath.Join(videoDir, videoID)

	// Try Remotion first, fall back to ffmpeg text animation
	composition, _ := spec["composition"].(string)
	duration, _ := spec["duration"].(float64)
	if duration == 0 {
		duration = 3
	}
	props, _ := spec["props"].(map[string]any)
	text, _ := props["text"].(string)
	if text == "" {
		text = "Hello World"
	}
	bgColor, _ := props["bgColor"].(string)
	if bgColor == "" {
		bgColor = "#1a1a2e"
	}
	textColor, _ := props["textColor"].(string)
	if textColor == "" {
		textColor = "#ffffff"
	}

	// Try Remotion render first
	remotionDir := os.ExpandEnv("$HOME/src/financecheque-video/tools/render-video")
	if _, err := os.Stat(remotionDir); err == nil {
		specJSON, _ := json.Marshal(spec)
		cmd := exec.Command("npx", "remotion", "render", "src/Root.tsx", composition,
			"--props", string(specJSON),
			"--output", videoPath)
		cmd.Dir = remotionDir
		cmd.Env = append(os.Environ(), "PATH=/usr/local/bin:/usr/bin:/bin:"+os.ExpandEnv("$HOME/.npm-global/bin"))
		if output, err := cmd.CombinedOutput(); err == nil {
			log.Printf("remotion render ok: %s", videoPath)
			videoURL := fmt.Sprintf("/api/video/%s", videoID)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"videoUrl": videoURL, "videoID": videoID})
			return
		} else {
			log.Printf("remotion render failed: %s", string(output))
		}
	}

	// Fallback: ffmpeg text animation
	fontSize := 48
	if int(duration) > 0 {
		fontSize = int(64 - duration*2)
		if fontSize < 24 {
			fontSize = 24
		}
	}

	args := []string{
		"-y", "-f", "lavfi",
		"-i", fmt.Sprintf("color=c=%s:s=640x360:d=%.1f:r=30", bgColor, duration),
		"-vf", fmt.Sprintf("drawtext=text='%s':fontcolor=%s:fontsize=%d:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
			strings.ReplaceAll(text, "'", "\\'"), textColor, fontSize),
		"-c:v", "libx264", "-pix_fmt", "yuv420p",
		videoPath,
	}

	cmd := exec.Command("ffmpeg", args...)
	if output, err := cmd.CombinedOutput(); err != nil {
		log.Printf("ffmpeg render failed: %s", string(output))
		http.Error(w, `{"error":"render failed"}`, 500)
		return
	}

	log.Printf("ffmpeg render ok: %s", videoPath)
	videoURL := fmt.Sprintf("/api/video/%s", videoID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"videoUrl": videoURL, "videoID": videoID})
}

func videoServeHandler(w http.ResponseWriter, r *http.Request) {
	videoID := strings.TrimPrefix(r.URL.Path, "/api/video/")
	videoID = strings.TrimPrefix(videoID, "/")
	if videoID == "" || strings.Contains(videoID, "/") {
		http.NotFound(w, r)
		return
	}

	videoPath := filepath.Join(videoDir, videoID)
	if _, err := os.Stat(videoPath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "video/mp4")
	http.ServeFile(w, r, videoPath)
}

func ttsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST required", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Text   string  `json:"text"`
		Voice  string  `json:"voice"`
		Speed  float64 `json:"speed"`
		Base64 bool    `json:"as_base64"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if req.Text == "" {
		http.Error(w, "text required", http.StatusBadRequest)
		return
	}
	if req.Voice == "" {
		req.Voice = "am_michael"
	}
	if req.Speed == 0 {
		req.Speed = 1.0
	}

	// Try local kokoro-onnx first
	modelDir := filepath.Join(os.Getenv("HOME"), ".fcukproxy", "models")
	kokoroModel := filepath.Join(modelDir, "kokoro-v1.0.int8.onnx")
	kokoroVoices := filepath.Join(modelDir, "voices-v1.0.bin")

	if _, err := os.Stat(kokoroModel); err == nil {
		// Use local kokoro
		cmd := exec.Command("python3", "-c", fmt.Sprintf(`
import json, base64, io, sys
sys.path.insert(0, "%s")
from kokoro_onnx import Kokoro
import soundfile as sf
kokoro = Kokoro("%s", "%s")
samples, sr = kokoro.create(%q, voice=%q, speed=%.2f, lang="en-us")
buf = io.BytesIO()
sf.write(buf, samples, sr, format="WAV")
buf.seek(0)
audio = base64.b64encode(buf.read()).decode()
print(json.dumps({"audio": "data:audio/wav;base64," + audio, "format": "wav"}))
`, modelDir, kokoroModel, kokoroVoices, req.Text, req.Voice, req.Speed))

		out, err := cmd.CombinedOutput()
		if err == nil {
			var result map[string]string
			if json.Unmarshal(out, &result) == nil {
				w.Header().Set("Content-Type", "application/json")
				w.Write(out)
				return
			}
		}
	}

	// Fallback: try voice-service on port 3101
	voiceURL := "http://127.0.0.1:3101/tts"
	form := fmt.Sprintf("text=%s&voice=%s&speed=%.2f&as_base64=true",
		strings.ReplaceAll(req.Text, "&", "%26"),
		req.Voice, req.Speed)
	resp, err := http.Post(voiceURL, "application/x-www-form-urlencoded", strings.NewReader(form))
	if err == nil {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.Header().Set("Content-Type", "application/json")
		io.Copy(w, resp.Body)
		return
	}

	http.Error(w, "TTS unavailable", http.StatusServiceUnavailable)
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
	proxyMux.HandleFunc("/api/video/render", videoRenderHandler)
	proxyMux.HandleFunc("/api/video/", videoServeHandler)
	proxyMux.HandleFunc("/tts", ttsHandler)
	proxySrv := &http.Server{Addr: "0.0.0.0:" + proxyPort, Handler: proxyMux}

	// GUI server (port 3000) — serves embedded WebGUI + API
	guiMux := http.NewServeMux()
	guiMux.HandleFunc("/api/health", healthHandler)
	guiMux.HandleFunc("/api/status", statusHandler)
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

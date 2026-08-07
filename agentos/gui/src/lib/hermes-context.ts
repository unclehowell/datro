import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { homedir } from "os";

const VAULT_PATH = process.env.VAULT_PATH || path.join(homedir(), "brain");
const PROJECTS_PATH = path.join(VAULT_PATH, "Projects", "datro");
const HOME = homedir();

// ============================================================
// SYSTEM PROMPT — Used only for LLM summarization and chat
// ============================================================
export const SYSTEM_PROMPT = `You are Hermes, an AI agent with full shell access. You execute commands on a Linux laptop. You have access to the filesystem, network, and all CLI tools. When you get results from a tool, present them clearly to the user. Be concise.`;

// ============================================================
// TOOL CALL INTERFACE
// ============================================================
export interface ToolCall {
  tool: string;
  params: Record<string, string>;
}

// ============================================================
// INTENT CLASSIFIER — Deterministic, no LLM needed
// Maps natural language → shell commands
// ============================================================
interface IntentPattern {
  patterns: RegExp[];
  command: (match: RegExpMatchArray, msg: string) => string;
  description: string;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Time/date
  { patterns: [/what time|current time|show.*time|what.*time|time now|tell.*time/i], command: () => "date", description: "Show current time" },
  { patterns: [/what date|today.*date|date today|current date/i], command: () => "date '+%A %B %d, %Y'", description: "Show current date" },
  
  // System info
  { patterns: [/who am i|whoami|my user/i], command: () => "whoami", description: "Show current user" },
  { patterns: [/system info|uname|os info|what.*os|operating system|show.*system/i], command: () => "uname -a", description: "Show system info" },
  { patterns: [/uptime|how long.*running|system.*up/i], command: () => "uptime", description: "Show uptime" },
  
  // Files
  { patterns: [/list files|show.*files|what.*files|file list|show.*dir|show.*folder/i], command: (m, msg) => {
    const dirMatch = msg.match(/(?:in|at|from|under|of)\s+[~\/\w.]+/);
    const dir = dirMatch ? dirMatch[0].replace(/^(?:in|at|from|under|of)\s+/, '') : '~';
    return "ls -la " + dir.replace(/~/g, HOME);
  }, description: "List files" },
  { patterns: [/tree|folder structure|directory tree/i], command: () => "find . -maxdepth 3 -type f | head -30", description: "Show directory tree" },
  
  // Disk/memory
  { patterns: [/disk usage|disk space|how much.*disk|df /i], command: () => "df -h", description: "Show disk usage" },
  { patterns: [/memory|ram usage|how much.*memory|free /i], command: () => "free -h", description: "Show memory usage" },
  { patterns: [/space used|du |folder size|directory size/i], command: () => "du -sh ~/* 2>/dev/null | sort -rh | head -10", description: "Show folder sizes" },
  
  // Processes
  { patterns: [/running processes|list processes|ps |what.*running|top |htop/i], command: () => "ps aux --sort=-%mem | head -15", description: "Show processes" },
  { patterns: [/kill.*process|stop.*process|pkill/i], command: (m, msg) => {
    const nameMatch = msg.match(/kill\s+(?:the\s+)?(?:process\s+)?(\S+)/i);
    return nameMatch ? `pkill -f ${nameMatch[1]}` : 'echo "Specify process name to kill"';
  }, description: "Kill process" },
  
  // Network
  { patterns: [/network|ip address|my ip|interfaces|ifconfig|ip addr/i], command: () => "ip -brief addr", description: "Show network info" },
  { patterns: [/open ports|what.*ports|listening|ss |netstat/i], command: () => "ss -tlnp", description: "Show open ports" },
  { patterns: [/ping|reach|connectivity|internet/i], command: () => "curl -s -o /dev/null -w '%{http_code}' https://dns.google/resolve?name=google.com && echo ' OK'", description: "Check connectivity" },
  
  // Git
  { patterns: [/git status|repo status|git/i], command: () => "cd ~/datro && git status", description: "Git status" },
  { patterns: [/git log|recent commits|commit history/i], command: () => "cd ~/datro && git log --oneline -10", description: "Git log" },
  { patterns: [/git diff|changes|what.*changed/i], command: () => "cd ~/datro && git diff --stat", description: "Git diff" },
  
  // Vault / brain
  { patterns: [/vault|brain|obsidian|projects/i], command: () => "ls ~/brain/Projects/datro/", description: "List vault projects" },
  { patterns: [/search vault|search.*brain|find.*note/i], command: (m, msg) => {
    const q = msg.replace(/search\s+(?:vault|brain|for|notes?)\s*/i, '').trim();
    return q ? `grep -ril "${q}" ~/brain/ --include="*.md" | head -10` : 'echo "Specify search term"';
  }, description: "Search vault" },
  
  // PM2 / services
  { patterns: [/pm2|services|process manager|list.*pm2/i], command: () => "pm2 ls", description: "List PM2 processes" },
  { patterns: [/restart.*service|restart.*pm2|restart.*all/i], command: () => "pm2 restart all", description: "Restart all services" },
  { patterns: [/pm2 logs|service logs|view logs/i], command: () => "pm2 logs --lines 20 --nostream", description: "Show PM2 logs" },
  
  // Health checks
  { patterns: [/health|is.*running|check.*status|system.*status/i], command: () => "echo '== GUI ==' && curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 && echo '' && echo '== OmniRoute ==' && curl -s -o /dev/null -w '%{http_code}' http://localhost:20128/api/health && echo '' && echo '== Ollama ==' && curl -s -o /dev/null -w '%{http_code}' http://localhost:11434 && echo ''", description: "Check service health" },
  
  // Hermes
  { patterns: [/hermes.*status|agent.*status|hermes/i], command: () => "hermes status 2>/dev/null || echo 'hermes not available'", description: "Hermes status" },
  
  // Code
  { patterns: [/code count|lines of code|loc |how many.*lines/i], command: () => "find ~/agentos-gui/src -name '*.ts' -o -name '*.tsx' | xargs wc -l 2>/dev/null | tail -1", description: "Count lines of code" },
  { patterns: [/node version|nodejs|what.*node/i], command: () => "node --version", description: "Node version" },
  { patterns: [/python version|python3|what.*python/i], command: () => "python3 --version", description: "Python version" },
  
  // Weather (via curl)
  { patterns: [/weather|temperature outside|forecast/i], command: () => "curl -s 'https://wttr.in/?format=3'", description: "Weather" },
  
  // Website generation (the user's specific request)
  { patterns: [/generate.*website|create.*website|build.*website|make.*website|make.*page|create.*page/i], command: (m, msg) => {
    const portMatch = msg.match(/port\s+(\d+)/);
    const port = portMatch ? portMatch[1] : '8080';
    return HOME + "/agentos-gui/scripts/gen-website.sh " + port;
  }, description: "Generate website" },
  
  // Run arbitrary command
  { patterns: [/^(?:run|execute|exec|cmd|shell|terminal|bash)\s+(.+)/i], command: (m) => m[1], description: "Run command" },
];

export function classifyIntent(message: string): { command: string; description: string } | null {
  const msg = message.trim();
  for (const intent of INTENT_PATTERNS) {
    for (const pattern of intent.patterns) {
      const match = msg.match(pattern);
      if (match) {
        return { command: intent.command(match, msg), description: intent.description };
      }
    }
  }
  return null;
}

// ============================================================
// EXECUTE TOOL CALL
// ============================================================
export async function executeToolCall(tool: string, params: Record<string, string>): Promise<string> {
  switch (tool) {
    case "shell": {
      try {
        const cmd = (params.command || "echo ok")
          .replace(/~/g, HOME);
        const output = execSync(cmd, {
          encoding: 'utf-8',
          timeout: 60000,
          maxBuffer: 1024 * 1024,
          shell: '/bin/bash',
        });
        return output.slice(0, 5000) || "(no output)";
      } catch (err: any) {
        return `Error: ${err.stderr?.slice(0, 500) || err.message}`;
      }
    }

    case "vault_search": {
      const query = (params.query || "").toLowerCase();
      const results: string[] = [];
      try {
        const entries = fs.readdirSync(PROJECTS_PATH, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length >= 3) break;
          if (entry.isFile() && entry.name.endsWith('.md')) {
            const content = fs.readFileSync(path.join(PROJECTS_PATH, entry.name), 'utf-8');
            if (content.toLowerCase().includes(query) || query.split(' ').some(w => w.length > 2 && content.toLowerCase().includes(w))) {
              results.push(`[${entry.name}]\n${content.slice(0, 500)}`);
            }
          }
        }
      } catch {}
      return results.length > 0 ? results.join('\n\n') : "No matching notes found.";
    }

    case "file_read": {
      try {
        const p = (params.path || "").replace(/~/g, HOME);
        const content = fs.readFileSync(p, 'utf-8');
        return content.slice(0, 5000);
      } catch (err: any) {
        return `Error: ${err.message}`;
      }
    }

    default:
      return `Unknown tool: ${tool}. Available: shell, vault_search, file_read`;
  }
}

// ============================================================
// BUILD CHAT CONTEXT — For LLM summarization/chat
// ============================================================
export function buildChatContext(userMessage: string, existingMessages: Array<{role: string; content: string}>): Array<{role: string; content: string}> {
  const messages: Array<{role: string; content: string}> = [];
  messages.push({ role: "system", content: SYSTEM_PROMPT });
  const recent = existingMessages.slice(-5);
  for (const msg of recent) {
    messages.push({ role: msg.role, content: msg.content });
  }
  return messages;
}

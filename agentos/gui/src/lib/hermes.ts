const HERMES_URL = process.env.HERMES_URL || "http://localhost:9119";

export interface AgentStatus {
  online: boolean;
  currentTask: string | null;
  uptime: number;
  memoryUsed: string;
  activeSessions: number;
}

export async function getHermesStatus(): Promise<AgentStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${HERMES_URL}/`, {
      signal: controller.signal,
      headers: { Accept: "text/html" },
    });
    clearTimeout(timeout);
    // Any HTTP response means Hermes is running (even 500 = running but unconfigured)
    return { online: true, currentTask: null, uptime: 0, memoryUsed: "N/A", activeSessions: 0 };
  } catch {
    return { online: false, currentTask: null, uptime: 0, memoryUsed: "0MB", activeSessions: 0 };
  }
}

export async function sendToHermes(message: string, context?: string): Promise<string> {
  const res = await fetch(`${HERMES_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
  if (!res.ok) throw new Error(`Hermes error: ${res.status}`);
  const data = await res.json();
  return data.reply || data.content || "No response";
}

export async function listSkills(): Promise<string[]> {
  try {
    const res = await fetch(`${HERMES_URL}/api/skills`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.skills || [];
  } catch {
    return [];
  }
}

export async function executeSkill(name: string, input: string): Promise<string> {
  const res = await fetch(`${HERMES_URL}/api/skills/${name}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error(`Skill ${name} error: ${res.status}`);
  const data = await res.json();
  return data.output || "No output";
}

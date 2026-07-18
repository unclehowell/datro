const MEM0_URL = process.env.MEM0_URL || "https://api.mem0.ai/v1";
const MEM0_API_KEY = process.env.MEM0_API_KEY || "";

export interface MemoryEntry {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
  created_at: string;
}

export interface MemorySearchResult {
  results: MemoryEntry[];
}

export async function searchMemory(query: string, userId = "sion", limit = 10): Promise<MemoryEntry[]> {
  if (!MEM0_API_KEY) return [];
  try {
    const res = await fetch(`${MEM0_URL}/search/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${MEM0_API_KEY}`,
      },
      body: JSON.stringify({ query, user_id: userId, limit }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || data.memories || [];
  } catch {
    return [];
  }
}

export async function addMemory(
  content: string,
  userId = "sion",
  metadata: Record<string, unknown> = {},
): Promise<string | null> {
  if (!MEM0_API_KEY) return null;
  try {
    const res = await fetch(`${MEM0_URL}/memories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${MEM0_API_KEY}`,
      },
      body: JSON.stringify({ messages: [{ role: "user", content }], user_id: userId, metadata }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || data.memories?.[0]?.id || null;
  } catch {
    return null;
  }
}

export async function listMemories(userId = "sion", limit = 50): Promise<MemoryEntry[]> {
  if (!MEM0_API_KEY) return [];
  try {
    const res = await fetch(`${MEM0_URL}/memories/?user_id=${userId}&limit=${limit}`, {
      headers: { Authorization: `Token ${MEM0_API_KEY}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.memories || data.results || [];
  } catch {
    return [];
  }
}

export async function deleteMemory(memoryId: string): Promise<boolean> {
  if (!MEM0_API_KEY) return false;
  try {
    const res = await fetch(`${MEM0_URL}/memories/${memoryId}/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${MEM0_API_KEY}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

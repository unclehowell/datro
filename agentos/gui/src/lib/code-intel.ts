import { execSync } from "child_process";
import { homedir } from "os";
import { join } from "path";

export interface SymbolInfo {
  name: string;
  kind: "function" | "class" | "method" | "variable" | "interface" | "type" | "module";
  file: string;
  line: number;
  column: number;
  signature?: string;
}

export interface FileIndex {
  path: string;
  language: string;
  symbols: SymbolInfo[];
  imports: string[];
  size: number;
  lastModified: string;
}

export interface RepoIndex {
  root: string;
  branch: string;
  files: FileIndex[];
  symbolCount: number;
  fileCount: number;
  indexedAt: string;
}

const INDEX_DIR = process.env.CODE_INDEX_DIR || join(homedir(), ".agentos", "code-index");

export async function indexRepository(repoPath: string): Promise<RepoIndex> {
  const res = await fetch("http://localhost:3100/index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: repoPath }),
  });
  if (!res.ok) throw new Error(`Index service error: ${res.status}`);
  return res.json();
}

export async function searchSymbols(query: string, repoPath?: string): Promise<SymbolInfo[]> {
  const params = new URLSearchParams({ q: query });
  if (repoPath) params.set("repo", repoPath);
  const res = await fetch(`http://localhost:3100/search/symbols?${params}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getFileContext(filePath: string, lineRange?: [number, number]): Promise<{
  content: string;
  symbols: SymbolInfo[];
  references: Array<{ file: string; line: number }>;
}> {
  const params = new URLSearchParams({ path: filePath });
  if (lineRange) { params.set("start", String(lineRange[0])); params.set("end", String(lineRange[1])); }
  const res = await fetch(`http://localhost:3100/context?${params}`);
  if (!res.ok) return { content: "", symbols: [], references: [] };
  return res.json();
}

export async function getRepoGraph(repoPath: string): Promise<{
  nodes: Array<{ id: string; type: string; label: string }>;
  edges: Array<{ source: string; target: string; type: string }>;
}> {
  const res = await fetch(`http://localhost:3100/graph?repo=${encodeURIComponent(repoPath)}`);
  if (!res.ok) return { nodes: [], edges: [] };
  return res.json();
}

export async function getIndexedRepos(): Promise<Array<{
  path: string;
  branch: string;
  fileCount: number;
  symbolCount: number;
  indexedAt: string;
}>> {
  const res = await fetch("http://localhost:3100/repos");
  if (!res.ok) return [];
  return res.json();
}

export async function searchCode(query: string, repoPath?: string): Promise<Array<{
  file: string;
  line: number;
  content: string;
  score: number;
}>> {
  const params = new URLSearchParams({ q: query });
  if (repoPath) params.set("repo", repoPath);
  const res = await fetch(`http://localhost:3100/search/code?${params}`);
  if (!res.ok) return [];
  return res.json();
}

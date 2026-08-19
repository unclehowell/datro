// ─── Hermes Profile Manager ────────────────────────────────────
// Manages two OpenClaw gateway profiles (mutually exclusive):
//   hermes-local  → ollama-cloud LLM             [Support Agent] GUI: 18789
//   hermes-proxy  → local minicpm5-32k (1B)       [Main Agent]   GUI: localhost:3000/chat
//
// Only one can run at a time. Neither auto-starts.
// ──────────────────────────────────────────────────────────────

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type HermesProfile = "hermes-local" | "hermes-proxy" | "none";

export interface ProfileState {
  running: boolean;
  starting: boolean;
  stopping: boolean;
  guiPort: number;
  guiUrl: string;
  label: string;
  description: string;
  model: string;
}

export interface HermesState {
  hermesLocal: ProfileState;
  hermesProxy: ProfileState;
  busy: boolean;
  message?: string;
}

const PROFILE_META: Record<string, { guiPort: number; guiUrl: string; label: string; description: string; model: string }> = {
  "hermes-local": { guiPort: 18789, guiUrl: "http://127.0.0.1:18789/", label: "Support Agent", description: "ollama-cloud LLM · remote", model: "ollama-cloud" },
  "hermes-proxy": { guiPort: 3000,  guiUrl: "http://localhost:3000/chat", label: "Main Agent", description: "minicpm5-32k (1B) · local", model: "minicpm5-32k (1B)" },
};

const busy = { local: false, proxy: false };

function ensureRuntimeEnv(): void {
  if (!process.env.XDG_RUNTIME_DIR) {
    const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
    if (uid !== undefined) process.env.XDG_RUNTIME_DIR = `/run/user/${uid}`;
  }
}

async function svcActive(name: string): Promise<boolean> {
  ensureRuntimeEnv();
  try {
    const { stdout } = await execFileAsync(
      "systemctl", ["--user", "is-active", `${name}.service`],
      { timeout: 8_000 }
    );
    return stdout.trim() === "active";
  } catch {
    return false;
  }
}

async function svcAction(name: string, action: "start" | "stop"): Promise<void> {
  ensureRuntimeEnv();
  try {
    await execFileAsync("systemctl", ["--user", action, `${name}.service`], { timeout: 60_000 });
  } catch {
    // best effort — state check afterward is authoritative
  }
}

export async function getProfileState(name: string): Promise<ProfileState> {
  const meta = PROFILE_META[name] || PROFILE_META["hermes-local"];
  const running = await svcActive(name);
  const busyKey = name === "hermes-local" ? "local" : "proxy";
  return {
    running,
    starting: busy[busyKey as keyof typeof busy] && !running,
    stopping: busy[busyKey as keyof typeof busy] && running,
    guiPort: meta.guiPort,
    guiUrl: meta.guiUrl,
    label: meta.label,
    description: meta.description,
    model: meta.model,
  };
}

export async function getHermesState(): Promise<HermesState> {
  const [hermesLocal, hermesProxy] = await Promise.all([
    getProfileState("hermes-local"),
    getProfileState("hermes-proxy"),
  ]);
  return { hermesLocal, hermesProxy, busy: busy.local || busy.proxy };
}

export async function startProfile(profile: string): Promise<HermesState> {
  if (profile !== "hermes-local" && profile !== "hermes-proxy") {
    return { ...(await getHermesState()), message: `unknown profile: ${profile}` };
  }
  const key = profile === "hermes-local" ? "local" : "proxy";
  if (busy[key]) {
    return { ...(await getHermesState()), message: `${profile} is busy` };
  }

  const running = await svcActive(profile);
  if (running) {
    return { ...(await getHermesState()), message: `${profile} already running` };
  }

  busy[key] = true;
  try {
    await svcAction(profile, "start");
    return { ...(await getHermesState()), message: `${profile} started` };
  } catch (e: any) {
    return { ...(await getHermesState()), message: `start failed: ${e?.message || e}` };
  } finally {
    busy[key] = false;
  }
}

export async function stopProfile(profile: string): Promise<HermesState> {
  if (profile !== "hermes-local" && profile !== "hermes-proxy") {
    return { ...(await getHermesState()), message: `unknown profile: ${profile}` };
  }
  const key = profile === "hermes-local" ? "local" : "proxy";
  if (busy[key]) {
    return { ...(await getHermesState()), message: `${profile} is busy` };
  }

  const running = await svcActive(profile);
  if (!running) {
    return { ...(await getHermesState()), message: `${profile} not running` };
  }

  busy[key] = true;
  try {
    await svcAction(profile, "stop");
    return { ...(await getHermesState()), message: `${profile} stopped` };
  } catch (e: any) {
    return { ...(await getHermesState()), message: `stop failed: ${e?.message || e}` };
  } finally {
    busy[key] = false;
  }
}

/** Backward compat: switch to a single profile, stop the other. */
export async function switchToProfile(
  target: HermesProfile
): Promise<HermesState> {
  if (target === "none") {
    await Promise.all([stopProfile("hermes-local"), stopProfile("hermes-proxy")]);
    return getHermesState();
  }
  // Stop the other, start the target
  const other = target === "hermes-local" ? "hermes-proxy" : "hermes-local";
  await stopProfile(other);
  await new Promise((r) => setTimeout(r, 800));
  return startProfile(target);
}

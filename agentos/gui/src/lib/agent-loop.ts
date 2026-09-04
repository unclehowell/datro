// ============================================================
// AgentLoop singleton
// ============================================================
// Shared between the chat route, the voicemail route, and any other
// caller that needs the tool registry. v1.11.29: previously only
// the chat route could spin up the loop; the voicemail route had
// no way to invoke real tool calls, so a voicemail saying "fix
// the build" got a polite acknowledgement instead of execution.
// ============================================================

import { AgentLoop } from "@/runtime/loop";

let agentLoop: AgentLoop | null = null;

export function getAgentLoop(): AgentLoop {
  if (!agentLoop) {
    agentLoop = new AgentLoop({
      maxIterations: 200,
      maxToolRounds: 20,
      checkpointEvery: 10,
      useLLM: true,
      logLevel: "info",
      enableSubagents: true,
      maxSubagentDepth: 3,
    });
  }
  return agentLoop;
}

import { homedir } from "os";
import { join } from "path";

// Where the AgentOS child-proxy GUI is installed. Defaults to a location under
// the user's home so the app works on any machine; install.sh (or the service
// unit) sets AGENTOS_GUI_DIR explicitly.
export const AGENTOS_GUI_DIR =
  process.env.AGENTOS_GUI_DIR || join(homedir(), ".fcukproxy", "agentos-gui");

// Remotion compositions + rendered output live inside the GUI directory.
export const REMOTION_DIR = join(AGENTOS_GUI_DIR, "remotion");
export const REMOTION_OUT_DIR = join(REMOTION_DIR, "out");

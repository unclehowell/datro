// WS-13 (v1.11.35): smoke test for the financecheque release surface.
// CI gate: validates the version manifest is self-consistent and that the
// deployed parent answers with the same branch/version shape the branch
// claims.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = process.env.FCUK_SMOKE_BASE || "https://www.financecheque.uk";
let failed = 0;
const expect = (cond, msg) => {
  if (cond) console.log(`PASS ${msg}`);
  else { console.error(`FAIL ${msg}`); failed++; }
};

const root = new URL("../", import.meta.url).pathname;
const version = readFileSync(`${root}.version`, "utf8").trim();
expect(/^1\.1[1-9]\.\d+$/.test(version), `.version is a current semantic release (${version})`);

const manifest = JSON.parse(readFileSync(`${root}public/fcukproxy/ota-manifest.json`, "utf8"));
expect(Number.isInteger(manifest.release_sequence), "ota-manifest has an integer release_sequence");
expect(manifest.branch === "financecheque", "ota-manifest points at financecheque");
expect(manifest.apps["update-checker"], "ota-manifest tracks update-checker");
expect(manifest.components["agentos-gui"], "ota-manifest tracks agentos-gui");

let live = null;
try {
  const r = await fetch(`${BASE}/api/version`, { signal: AbortSignal.timeout(25000) });
  live = await r.json();
  expect(r.ok, "/api/version responds on the live parent");
} catch (e) {
  expect(false, `/api/version reachable on ${BASE} (${e.message})`);
}
if (live) {
  expect(typeof live.version === "string" && live.version.length > 0, `/api/version reports a version (${live.version})`);
  expect(live.branch === "financecheque", `/api/version branch is financecheque (got "${live.branch}")`);
}

process.exit(failed ? 1 : 0);
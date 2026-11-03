import test from "node:test";
import assert from "node:assert/strict";
import { interpretationHtml, INTERP_THEORIES, INTERP_PAGES, INTERP_EV_PATHS } from "./interpretation.js";
// Interpretation layer guard (25 Oct 2026): every entry is labelled, sourced and testable; public wording rules hold.
const BANNED = /\b(says|claims|according to|hearsay|unverified|alleged|fraud|stolen)\b/i;
test("every interpretation entry is labelled and testable", () => {
  for (const [id, t] of Object.entries(INTERP_THEORIES)) {
    assert.ok(["Inference", "Theory", "Counter-reading", "Discarded"].includes(t.kind), id);
    assert.ok(t.rests.length > 0 && t.confirm && t.refute && t.status, id);
    for (const s of [t.text, t.confirm, t.refute, t.status, ...t.rests]) assert.ok(!BANNED.test(s) && !/\bSion\b/.test(s), id + ": " + s);
  }
});
test("page map points only at known entries and renders a separate section", () => {
  for (const [p, ids] of Object.entries(INTERP_PAGES)) {
    assert.match(p, /^\/evidence(-library)?\//);
    for (const id of ids) assert.ok(INTERP_THEORIES[id], p + " " + id);
    const h = interpretationHtml(p);
    assert.ok(h.startsWith('<section class="ghf-interpretation"') && h.endsWith("</section>"));
  }
  for (const p of Object.values(INTERP_EV_PATHS)) assert.match(p, /^\/evidence\/ev-\d{4}-/);
  assert.equal(interpretationHtml("/not-an-evidence-page/"), "");
});

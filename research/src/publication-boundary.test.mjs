import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./index.js", import.meta.url), "utf8");

test("public GraphQL content lists reject non-published status filters", () => {
  assert.match(
    source,
    /if \(status !== "publish"\) \{\s*return json\(\{ errors: \[\{ message: "Only published content is publicly readable" \}\] \}, 400\);\s*\}/
  );
});

test("single page/post, JSON catalogue and preview routes remain published-only", () => {
  assert.match(source, /source_type=\? AND status='publish'/);
  assert.match(source, /const conditions = \["status = 'publish'"\]/);
  assert.match(source, /WHERE path = \? AND status = 'publish'/);
});

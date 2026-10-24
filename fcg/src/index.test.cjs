const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "index.js"), "utf8");

test("public posts query rejects non-published statuses", () => {
  assert.match(
    source,
    /if \(status !== "publish"\) throw new Error\("Only published content is publicly readable"\)/
  );
});

test("single post/page lookup requires published status and matching content type", () => {
  assert.match(
    source,
    /WHERE slug = \? AND status = 'publish' AND post_type = \? LIMIT 1/
  );
  assert.match(source, /\.bind\(single\[2\], key\)\.first\(\)/);
});

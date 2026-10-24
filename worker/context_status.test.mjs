import test from "node:test";
import assert from "node:assert/strict";
import { contextStatus } from "./context_status.mjs";

const checks = {
  thread: true, dartboard: true, kb: true, research: true,
  wayback: true, projects: true, arsenal: true
};

function completeDraft(overrides = {}) {
  const context = {
    as_of: "2026-10-24T10:00:00Z",
    fingerprint: "ctx-123",
    archive: {
      search: "https://email.bucklerfamily.estate/api/search?q=body",
      thread: "https://email.bucklerfamily.estate/reference/abc"
    },
    dartboard: { url: "https://bucklerfamily.estate/?r=9#roadmap", lane: "example-lane" },
    stage: "internal review",
    rungs_spent: ["request", "chaser"],
    kb_items: 2,
    verification: {
      version: "v0.8.0",
      fingerprint: "ctx-123",
      status: "VERIFIED",
      checked_at: "2026-10-24T10:05:00Z",
      reviewer: "ChatGPT",
      thread_result: "FOUND",
      checks: { ...checks }
    }
  };
  return {
    version: "v0.8.0",
    last_change: "2026-10-24T09:30:00Z",
    context,
    ...overrides
  };
}

test("missing context blocks promotion", () => {
  const result = contextStatus({ version: "v0.1.0", last_change: "2026-10-24T09:00:00Z" });
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("context pack missing"));
});

test("complete current-version source sweep passes", () => {
  const result = contextStatus(completeDraft());
  assert.equal(result.ok, true);
  assert.deepEqual(result.blockers, []);
});

test("stale context pack blocks even with an otherwise valid review", () => {
  const draft = completeDraft();
  draft.context.as_of = "2026-10-24T09:00:00Z";
  const result = contextStatus(draft);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("context pack predates latest recorded change"));
});

test("missing independent source check blocks", () => {
  const draft = completeDraft();
  draft.context.verification.checks.research = false;
  const result = contextStatus(draft);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("research not checked"));
});

test("verification for another version or context fingerprint blocks", () => {
  const draft = completeDraft();
  draft.context.verification.version = "v0.7.0";
  draft.context.verification.fingerprint = "old-context";
  const result = contextStatus(draft);
  assert.ok(result.blockers.includes("verification version mismatch"));
  assert.ok(result.blockers.includes("verification fingerprint mismatch"));
});

test("a verified archive search with no matching thread is allowed only when explicit", () => {
  const draft = completeDraft();
  draft.context.archive.thread = null;
  draft.context.verification.thread_result = "NONE_FOUND";
  assert.equal(contextStatus(draft).ok, true);

  draft.context.verification.thread_result = null;
  const blocked = contextStatus(draft);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.blockers.includes("thread search result not recorded"));
});

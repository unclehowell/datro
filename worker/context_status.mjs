export const REQUIRED_CONTEXT_CHECKS = Object.freeze([
  "thread", "dartboard", "kb", "research", "wayback", "projects", "arsenal"
]);

/**
 * A context pack is an index, not proof that its sources were read.
 * Promotion requires a version- and fingerprint-matched verification record.
 * This module intentionally fails closed on missing or stale metadata.
 */
export function contextStatus(draft) {
  const context = draft && draft.context;
  const verification = context && context.verification;
  const blockers = [];

  if (!context || typeof context !== "object") {
    return { ok: false, state: "BLOCKED", blockers: ["context pack missing"] };
  }

  const builtAt = Date.parse(context.as_of || "");
  const lastChange = Date.parse((draft && draft.last_change) || "");
  if (!Number.isFinite(builtAt)) {
    blockers.push("context pack timestamp missing");
  } else if (Number.isFinite(lastChange) && builtAt < lastChange) {
    blockers.push("context pack predates latest recorded change");
  }

  if (!context.fingerprint) blockers.push("context fingerprint missing");
  if (!context.archive || !context.archive.search) blockers.push("archive search link missing");
  if (!context.dartboard || !context.dartboard.url || !context.dartboard.lane) {
    blockers.push("matching dartboard lane missing");
  }
  if (!context.stage || /not yet on the dartboard/i.test(context.stage)) {
    blockers.push("escalation stage missing");
  }
  if (!Array.isArray(context.rungs_spent)) blockers.push("escalation history missing");
  if (context.kb_items === null || context.kb_items === undefined || !Number.isFinite(Number(context.kb_items))) {
    blockers.push("knowledge-base mapping/count missing");
  }

  if (!verification || verification.status !== "VERIFIED") {
    blockers.push("source sweep not verified");
  } else {
    if (verification.version !== draft.version) blockers.push("verification version mismatch");
    if (!context.fingerprint || verification.fingerprint !== context.fingerprint) {
      blockers.push("verification fingerprint mismatch");
    }

    const checkedAt = Date.parse(verification.checked_at || "");
    if (!Number.isFinite(checkedAt)) {
      blockers.push("verification timestamp missing");
    } else {
      if (Number.isFinite(lastChange) && checkedAt < lastChange) {
        blockers.push("verification predates latest recorded change");
      }
      if (Number.isFinite(builtAt) && checkedAt < builtAt) {
        blockers.push("verification predates context pack");
      }
    }

    const checks = verification.checks || {};
    for (const key of REQUIRED_CONTEXT_CHECKS) {
      if (checks[key] !== true) blockers.push(key + " not checked");
    }

    if (verification.thread_result === "FOUND") {
      if (!context.archive || !context.archive.thread) blockers.push("thread marked found but thread link missing");
    } else if (verification.thread_result === "NONE_FOUND") {
      if (context.archive && context.archive.thread) blockers.push("thread marked absent but thread link exists");
      if (!context.archive || !context.archive.search) blockers.push("no-thread result lacks archive search link");
    } else {
      blockers.push("thread search result not recorded");
    }
  }

  return {
    ok: blockers.length === 0,
    state: blockers.length === 0 ? "VERIFIED" : "BLOCKED",
    blockers
  };
}

export function contextVerified(draft) {
  return contextStatus(draft).ok;
}

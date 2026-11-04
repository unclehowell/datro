// hive-ingest: forwarded project mail -> classified -> HubSpot task for the hive to review.
// It never replies, sends or forwards mail. Draft review and sending stay with the existing hive gates and the owner.
//
// Secrets (set by the deploy workflow from GitHub secrets): HUBSPOT_TOKEN, OWNER_EMAIL, OWNER_CONTACT_ID
// Binding: DB (D1). Tables are created on first use.

import PostalMime from "postal-mime";
import { bodyFor, buildTask, classify, domainOf, isFromOwnerForward } from "./classify.mjs";

const MAX_RAW_BYTES = 2_000_000;
let schemaReady;

function ensureSchema(db) {
  schemaReady ??= db
    .prepare(
      "CREATE TABLE IF NOT EXISTS correspondence (message_id TEXT PRIMARY KEY, received_on TEXT, sender_domain TEXT, class TEXT, body_name TEXT, subject TEXT, needs_owner INTEGER DEFAULT 0, hubspot_task_id TEXT)"
    )
    .run();
  return schemaReady;
}

async function createTask(env, task) {
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/tasks", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.HUBSPOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: {
        hs_task_subject: task.subject,
        hs_task_body: task.body,
        hs_task_status: "NOT_STARTED",
        hs_task_priority: task.priority,
        hs_task_type: task.type,
        hs_timestamp: new Date().toISOString(),
      },
      associations: [
        {
          to: { id: env.OWNER_CONTACT_ID },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 204 }], // task -> contact
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}`);
  return (await res.json()).id;
}

export default {
  async email(message, env) {
    if (message.rawSize > MAX_RAW_BYTES) return; // drop silently

    const mail = await PostalMime.parse(message.raw);
    const from = mail.from?.address || message.from || "";
    const subject = mail.subject || "";
    const text = mail.text || "";
    const cls = classify({ from, subject, text });

    // Only mail the owner's Gmail forwarded gets through; the one exception is Gmail's own
    // forwarding confirmation, which creates an owner task and nothing else.
    if (cls !== "verify" && !isFromOwnerForward(message.headers, env.OWNER_EMAIL)) return;

    await ensureSchema(env.DB);
    const messageId = mail.messageId || `${from}|${subject}|${mail.date || ""}`;
    const bodyName = bodyFor(from);

    const ins = await env.DB.prepare(
      "INSERT OR IGNORE INTO correspondence (message_id, received_on, sender_domain, class, body_name, subject, needs_owner) VALUES (?,?,?,?,?,?,?)"
    )
      .bind(messageId, new Date().toISOString(), domainOf(from), cls, bodyName, subject.slice(0, 200), cls === "owner" || cls === "verify" ? 1 : 0)
      .run();
    if (ins.meta?.changes === 0) return; // duplicate

    if (cls === "noise" || cls === "routine") return; // logged only

    try {
      const task = buildTask({ cls, bodyName, subject, from, date: mail.date, text });
      const id = await createTask(env, task);
      await env.DB.prepare("UPDATE correspondence SET hubspot_task_id = ? WHERE message_id = ?").bind(String(id), messageId).run();
    } catch (err) {
      // Let a retry happen: remove the log row, then fail the delivery.
      await env.DB.prepare("DELETE FROM correspondence WHERE message_id = ?").bind(messageId).run();
      throw err;
    }
  },

  async fetch() {
    return Response.json({ ok: true, name: "hive-ingest" });
  },
};

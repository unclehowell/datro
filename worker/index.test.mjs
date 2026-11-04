import test from "node:test";
import assert from "node:assert/strict";
import worker from "./index.js";

// Minimal in-memory stand-in for the D1 calls the Worker makes.
function fakeDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async run() {
          if (sql.startsWith("CREATE TABLE")) return { meta: { changes: 0 } };
          if (sql.startsWith("INSERT OR IGNORE")) {
            if (rows.has(args[0])) return { meta: { changes: 0 } };
            rows.set(args[0], { class: args[3], task: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("UPDATE")) { rows.get(args[1]).task = args[0]; return { meta: { changes: 1 } }; }
          if (sql.startsWith("DELETE")) { rows.delete(args[0]); return { meta: { changes: 1 } }; }
          throw new Error("unexpected sql " + sql);
        },
      };
      return stmt;
    },
  };
}

function mail({ from, subject, body, id, forwarded = true }) {
  const raw = [
    `From: <${from}>`, "To: <ingest@example.net>", `Subject: ${subject}`, `Message-ID: <${id}>`,
    "Date: Wed, 04 Nov 2026 12:00:00 +0000", "Content-Type: text/plain; charset=utf-8", "", body,
  ].join("\r\n");
  return {
    from, rawSize: raw.length, raw,
    headers: new Headers(forwarded ? { "x-forwarded-for": "owner@example.com ingest@example.net" } : {}),
  };
}

function env(db) {
  return { DB: db, HUBSPOT_TOKEN: "t", OWNER_EMAIL: "owner@example.com", OWNER_CONTACT_ID: "123" };
}

function stubFetch(status = 201) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    return new Response(JSON.stringify({ id: "999" }), { status });
  };
  return calls;
}

test("a real reply creates one draft task; a duplicate creates none", async () => {
  const calls = stubFetch();
  const db = fakeDb();
  const m = mail({ from: "a@sewbrec.org.uk", subject: "RE: data search", body: "We do not hold any site surveys.", id: "m1@x" });
  await worker.email(m, env(db));
  await worker.email(mail({ from: "a@sewbrec.org.uk", subject: "RE: data search", body: "x", id: "m1@x" }), env(db));
  assert.equal(calls.length, 1);
  assert.match(calls[0].body.properties.hs_task_subject, /OTHER AGENT'S TURN v0\.0\.1\] SEWBReC/);
  assert.equal(calls[0].body.associations[0].to.id, "123");
  assert.equal(db.rows.get("<m1@x>").task, "999");
});

test("mail not forwarded by the owner is dropped with no task", async () => {
  const calls = stubFetch();
  const db = fakeDb();
  await worker.email(mail({ from: "a@sewbrec.org.uk", subject: "s", body: "b", id: "m2@x", forwarded: false }), env(db));
  assert.equal(calls.length, 0);
  assert.equal(db.rows.size, 0);
});

test("acknowledgements are logged but make no task", async () => {
  const calls = stubFetch();
  const db = fakeDb();
  await worker.email(mail({ from: "icocasework@ico.org.uk", subject: "We have received your email", body: "ok", id: "m3@x" }), env(db));
  assert.equal(calls.length, 0);
  assert.equal(db.rows.get("<m3@x>").class, "routine");
});

test("owner asks become OWNER ACTION tasks", async () => {
  const calls = stubFetch();
  await worker.email(mail({ from: "a@wales.nhs.uk", subject: "Records", body: "Please complete the application form.", id: "m4@x" }), env(fakeDb()));
  assert.match(calls[0].body.properties.hs_task_subject, /^\[OWNER ACTION\]/);
  assert.equal(calls[0].body.properties.hs_task_priority, "HIGH");
});

test("Gmail forwarding confirmation is accepted without the forward header", async () => {
  const calls = stubFetch();
  await worker.email(mail({ from: "forwarding-noreply@google.com", subject: "Gmail Forwarding Confirmation", body: "code 123456", id: "m5@x", forwarded: false }), env(fakeDb()));
  assert.equal(calls.length, 1);
  assert.match(calls[0].body.properties.hs_task_subject, /forwarding confirmation/);
});

test("HubSpot failure removes the log row and rethrows so delivery can retry", async () => {
  stubFetch(500);
  const db = fakeDb();
  await assert.rejects(() => worker.email(mail({ from: "a@sewbrec.org.uk", subject: "s", body: "b", id: "m6@x" }), env(db)), /HubSpot 500/);
  assert.equal(db.rows.size, 0);
});

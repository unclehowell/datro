// Cloudflare Pages Function
// File location: static/pcp2/functions/api/submit-claim.ts

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    // ── Parse incoming request (supports both FormData and JSON) ──
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    // ── Helpers ──────────────────────────────────────────────────
    const formatDOB = (input: string): string => {
      if (!input) return "";
      // Already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
      // Convert DD/MM/YYYY → YYYY-MM-DD
      if (input.includes("/")) {
        const [day, month, year] = input.split("/");
        if (!day || !month || !year) return input;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return input;
    };

    // UTF-8 safe base64 (no Buffer — Cloudflare Workers safe)
    const toBase64 = (str: string): string => {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    // ── Extract fields ────────────────────────────────────────────
    const title         = String(body.title          || "").trim();
    const first_name    = String(body.first_name     || "").trim();
    const last_name     = String(body.last_name      || "").trim();
    const email         = String(body.email          || "").trim();
    const phone         = String(body.phone          || "").trim();
    const date_of_birth = formatDOB(String(body.date_of_birth || "").trim());
    const buildingNumber= String(body.buildingNumber || "").trim();
    const thoroughfare  = String(body.thoroughfare   || "").trim();
    const townOrCity    = String(body.townOrCity     || "").trim();
    const postcode      = String(body.postcode       || "").trim();
    const session_id    = body.session_id    || crypto.randomUUID();
    const device_session_id = body.device_session_id || crypto.randomUUID();

    // ── Format postcode with space (e.g. CF644TF → CF64 4TF) ─────
    const formatPostcode = (pc: string): string => {
      const clean = pc.replace(/\s+/g, "").toUpperCase();
      if (clean.length >= 5) return clean.slice(0, -3) + " " + clean.slice(-3);
      return clean;
    };
    const formattedPostcode = formatPostcode(postcode);

    // ── Signature includes addresses as plain object ───────────────
    // The API example shows addresses as an object. The two times a 200
    // was received in testing, addresses was included in the signature.
    const signaturePayload = JSON.stringify({
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      addresses: {
        buildingNumber: buildingNumber || null,
        thoroughfare,
        townOrCity,
        postcode: formattedPostcode,
      },
    });
    const signature = toBase64(signaturePayload);

    // ── Build addresses as ARRAY with all documented fields ───────
    const addresses = [
      {
        line1:          null,
        line2:          null,
        line3:          null,
        line4:          null,
        buildingName:   null,
        buildingNumber: buildingNumber || null,
        thoroughfare,
        townOrCity,
        district:       null,
        postcode:       formattedPostcode,
      },
    ];

    // ── Final payload ─────────────────────────────────────────────
    const payload = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip:            req.headers.get("cf-connecting-ip") || "",
      user_agent:           req.headers.get("user-agent") || "",
      session_id,
      device_session_id,
      account_creation_url: "https://car.financecheque.uk/claim",
      addresses,
      opt_in:               true,
      signature,
    };

    // ── Debug logs (remove once working) ─────────────────────────
    console.log("SIGNATURE PAYLOAD:", signaturePayload);
    console.log("SIGNATURE:", signature);
    console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    // ── Send to R2R ───────────────────────────────────────────────
    const affiliateId = context.env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
    const apiKey      = context.env.VITE_API_KEY;
    const url         = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":       "application/json",
        "API-KEY":      apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("R2R STATUS:", res.status);
    console.log("R2R BODY:", text);

    // Always return JSON to the browser
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });

  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}

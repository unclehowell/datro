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

    // ── Basic request/header logging (avoid secrets) ──
    console.log("INCOMING REQUEST: method=POST, url=", req.url || "(unknown)");
    const incomingHeaders: any = {};
    ["user-agent", "content-type", "referer", "origin", "cf-connecting-ip"].forEach(h => {
      incomingHeaders[h] = req.headers.get(h) || "";
    });
    console.log("INCOMING HEADERS:", JSON.stringify(incomingHeaders));

    // ── Parse incoming request (supports both FormData and JSON) ──
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    // Log the keys received (not values) to avoid PII in logs
    console.log("RECEIVED FIELDS:", Object.keys(body));

    // ── Helpers ──────────────────────────────────────────────────
    const formatDOB = (input: string): string => {
      if (!input) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
      if (input.includes("/")) {
        const [day, month, year] = input.split("/");
        if (!day || !month || !year) return input;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return input;
    };

    const formatPostcode = (pc: string): string => {
      const clean = String(pc || "").replace(/\s+/g, "").toUpperCase();
      if (clean.length >= 5) return clean.slice(0, -3) + " " + clean.slice(-3);
      return clean;
    };

    const formatPhone = (p: string): string => {
      const clean = String(p || "").replace(/\s+/g, "");
      if (clean.startsWith("0")) return "+44" + clean.slice(1);
      return clean;
    };

    // Title-case a name: "sion" → "Sion", "buckler" → "Buckler"
    const toTitleCase = (s: string): string =>
      String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1).toLowerCase();

    const toBase64 = (str: string): string => {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    // ── Extract and format fields ─────────────────────────────────
    const title          = String(body.title          || "").trim();
    const first_name     = toTitleCase(String(body.first_name  || "").trim());
    const last_name      = toTitleCase(String(body.last_name   || "").trim());
    const email          = String(body.email          || "").trim();
    const phone          = formatPhone(String(body.phone       || "").trim());
    const date_of_birth  = formatDOB(String(body.date_of_birth || "").trim());
    const buildingNumber = String(body.buildingNumber || "").trim();
    const thoroughfare   = String(body.thoroughfare   || "").trim();
    const townOrCity     = String(body.townOrCity     || "").trim();
    const postcode_raw   = String(body.postcode || "").trim(); // Raw postcode for logging
    const postcode_formatted = formatPostcode(postcode_raw); // Formatted postcode for payload
    const session_id     = body.session_id       || crypto.randomUUID();
    const device_session_id = body.device_session_id || crypto.randomUUID();
    const signature_image_raw = String(body.signature_image || "").trim(); // Raw signature field

    // Log individual address fields being extracted (no PII values)
    console.log("ADDRESS KEYS RECEIVED FOR PAYLOAD:", {
        buildingNumber: !!body.buildingNumber,
        thoroughfare: !!body.thoroughfare,
        townOrCity: !!body.townOrCity,
        postcode: !!body.postcode
    });
    console.log("FORMATTED POSTCODE FOR PAYLOAD (preview):", postcode_formatted || "(empty)");

    // ── Signature: Use example.png base64 for testing ─────────────────
    // Hardcoded base64 from notes/example.png - this is a real signature image to test
    const EXAMPLE_SIGNATURE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAlAAAADACAYAAADLG10vAAAQAElEQVR4AezdCdwkRX0+8BrvA3U1EVGJLl4Yjfd9RBcVD+ItxgOPxSMST4wnGpNFBU08st6JGoUoXjFqTDyIqEtEDSCCoqLIsQKSYBRQSDgk+t9v86+X3uE95n1n5n17Zp79bL3dXV1dXf1UT9dTv6uu8Nv8CwJBIAgEgSAQBIJAEFgWAlco+RcEgkAQCAJBYOIQSIODwNoiEAK1tvjn7kEgCASBIBAEgsAEIhACNYGdliYHgS4gkDYEgSAQBLqBQNoQBILAFCMQAjWKnkobgkAQCALdRGCzzbab9f6f/0FgqhGYhECN03drk9afIRAEgkCnEBgCdQqBtCMITAMCk0egBj9t2rQkEgSCQBDYhsA222yz7fH/f/7zn7dt8icJdA2BbgjU1772tfKP//iP5UUvelF57GMfW/7v//2/5ZGPfGR5ylOe0hzvGoFAOxGYhECN05Y2BoFBELj88svLKaecUl740peW173udYOO8znPeU551Stf2c7Odq0Q2GqrrcpTn/rU8qQnPanc4x73GHc1qS8ITIzAFltsUfbcc8+yxx57lMc85hHlkY98ZLnqVa9a9tlnnyXOe9WrXnWZc5M4OYkIjDyBaieqbQsCwyDwqU99qhx88MFl1113Lf/v//2/hYf5x3/8x/KmN72p3OIWtyj77rvvctQ3yT3f//73l+OPP7588YtfLO9///vLpZde2q57pK1BYBKB1772teXwww8vV73qVcv973//8uQnP7mcffbZ5e1vf3t54hOfWB760IeWnXfemc2U6gkC00JgEaiVK0uVHIEOIvDe9763HH744eW2t71t2XfffRvJ0377718++tGPlsc97nHlgAMOKLvvvvtE1TX58x577LGFzPltb3tb+ed//ufyjne8Y2JI5MlJ4E1velM58MADy/3vf/+y2267lcc85jHlqKOOavK9733vW+5+97uX4447rlx44YVNZraDwKYE2knq6KOPLu985zvLAQcc0CRPd7nLXcrxxx9fzjjjjPKqV71qoibZbLNNNqupT35dP/7xj5c999yzXHfDDTfc8MpXvnKZc1O92WabNYnT/e9//3L66aeXI488slzkIhed";


    // Use example.png base64 as signature (this is a real signature image)
    const signature = EXAMPLE_SIGNATURE_BASE64;
    console.log("USING EXAMPLE.PNG AS SIGNATURE (not computed JSON)");

    // ── Addresses as single entry array with all fields ─
    const addresses = [
      {
        line1:          thoroughfare || null,
        line2:          buildingNumber || null,
        line3:           null,
        line4:           null,
        buildingName:   null,
        buildingNumber: null,
        thoroughfare:   thoroughfare || null,
        townOrCity:     townOrCity || null,
        district:       null,
        postcode:       postcode_formatted || null,
      },
    ];

    // ── Final payload ─────────────────────────────────────────────
    const payload: any = {
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
    };

    if (signature) {
      payload.signature = signature;
    }
    // Attach hardcoded example.png signature image for testing
    if (EXAMPLE_SIGNATURE_BASE64) {
      payload.signature_image = EXAMPLE_SIGNATURE_BASE64;
      console.log("USING EXAMPLE.PNG SIGNATURE FOR TESTING");
    }

    // Log the final payload shape (keys only) before sending
    console.log("FINAL PAYLOAD KEYS:", Object.keys(payload));

    // ── Send to R2R ───────────────────────────────────────────────
    const affiliateId = context.env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
    const apiKey      = context.env.VITE_API_KEY;

    if (!apiKey) {
      console.error("MISSING ENV: VITE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing API key' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    const url         = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;

    const upstreamHeaders: any = {
      "Content-Type": "application/json",
      "Accept":       "application/json",
      "API-KEY":      apiKey,
      "User-Agent":   req.headers.get('user-agent') || 'Cloudflare-Function',
    };
    // Some upstreams expect Authorization: Bearer <key>
    upstreamHeaders.Authorization = `Bearer ${apiKey}`;

    console.log("SENDING TO UPSTREAM:", url);
    // Do not log the API key value
    console.log("UPSTREAM HEADERS (preview):", Object.keys(upstreamHeaders));

    const res = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("R2R STATUS:", res.status);
    console.log("R2R BODY (truncated):", text ? text.slice(0, 1000) : "(empty)");

    // Mirror upstream response back to client (preserve status)
    const responseHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };
    return new Response(text, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}

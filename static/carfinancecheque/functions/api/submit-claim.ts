// Cloudflare Pages Function
// File location: static/carfinancecheque/functions/api/submit-claim.ts

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, API-KEY",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    console.log("INCOMING REQUEST: method=POST, url=", req.url || "(unknown)");
    const incomingHeaders: any = {};
    ["user-agent", "content-type", "referer", "origin", "cf-connecting-ip"].forEach(h => {
      incomingHeaders[h] = req.headers.get(h) || "";
    });
    console.log("INCOMING HEADERS:", JSON.stringify(incomingHeaders));

    // Parse incoming request (supports both FormData and JSON)
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      const entries: [string, string][] = [];
      const promises: Promise<void>[] = [];
      formData.forEach((value, key) => {
        if (value instanceof File) {
          promises.push(value.text().then(text => entries.push([key, text])));
        } else {
          entries.push([key, String(value)]);
        }
      });
      await Promise.all(promises);
      body = Object.fromEntries(entries);
    }

    console.log("RECEIVED FIELDS:", Object.keys(body));

    // Helpers
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

    const toTitleCase = (s: string): string =>
      String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1).toLowerCase();

    // Extract and format fields
    const first_name       = toTitleCase(String(body.first_name || "").trim());
    const last_name        = toTitleCase(String(body.last_name || "").trim());
    const email            = String(body.email || "").trim();
    const phone            = formatPhone(String(body.phone || "").trim());
    const date_of_birth    = formatDOB(String(body.date_of_birth || "").trim());
    const buildingNumber   = String(body.buildingNumber || "").trim();
    const thoroughfare     = String(body.thoroughfare || "").trim();
    const townOrCity       = String(body.townOrCity || "").trim();
    const postcode_formatted = formatPostcode(String(body.postcode || "").trim());
    const session_id       = body.session_id || crypto.randomUUID();

    console.log("ADDRESS FIELDS:", {
      buildingNumber: !!buildingNumber,
      thoroughfare: !!thoroughfare,
      townOrCity: !!townOrCity,
      postcode: !!postcode_formatted
    });

    // Signature - spec wants plain base64 string
    let sigImage = String(body.signature_image || "");

    const extractBase64 = (dataUrl: string): string => {
      if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl || "";
      const commaIndex = dataUrl.indexOf(",");
      return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
    };

    const signatureBase64 = extractBase64(sigImage);

    // addresses - spec wants object (not array), key name is "addresses"
    const addresses = {
      line1: null,
      line2: null,
      line3: null,
      line4: null,
      buildingName: null,
      buildingNumber: buildingNumber || null,
      thoroughfare:   thoroughfare || null,
      townOrCity:     townOrCity || null,
      district:   null,
      postcode:       postcode_formatted || null,
    };

    // Build payload per API spec - ONLY allowed fields
    const payload: any = {
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip:  req.headers.get("cf-connecting-ip") || "",
      user_agent: req.headers.get("user-agent") || "",
      session_id,
      signature: signatureBase64,
      addresses,
    };

    console.log("FINAL PAYLOAD KEYS:", Object.keys(payload));

    // Send to R2R
    const affiliateId = context.env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
    const apiKey       = context.env.VITE_API_KEY;

    if (!apiKey) {
      console.error("MISSING ENV: VITE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing API key' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    const url = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;

    const upstreamHeaders: any = {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "API-KEY":       apiKey,
      "User-Agent":    req.headers.get('user-agent') || 'Cloudflare-Function',
    };

    console.log("SENDING TO UPSTREAM:", url);
    console.log("UPSTREAM HEADERS:", Object.keys(upstreamHeaders));

    const res = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("R2R STATUS:", res.status);
    console.log("R2R BODY (truncated):", text ? text.slice(0, 500) : "(empty)");

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

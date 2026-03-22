export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    // ✅ Parse incoming form-data or JSON
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    // ✅ Normalize fields
    const first_name = String(body.first_name || "").trim();
    const last_name = String(body.last_name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const date_of_birth = String(body.date_of_birth || "").trim();

    const buildingNumber = String(body.buildingNumber || "").trim();
    const thoroughfare = String(body.thoroughfare || "").trim();
    const townOrCity = String(body.townOrCity || "").trim();
    const postcode = String(body.postcode || "")
      .replace(/\s+/g, "")
      .toUpperCase();

    // ✅ Build addresses array (REQUIRED FORMAT)
    const addresses = [
      {
        buildingNumber,
        thoroughfare,
        townOrCity,
        postcode,
      },
    ];

    // ✅ Signature payload (ONLY these fields, EXACT order)
    const signaturePayloadObj = {
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      addresses,
    };

    const signaturePayload = JSON.stringify(signaturePayloadObj);

    // ✅ Generate HMAC SHA256 (HEX — NOT base64)
    const secret = context.env.R2R_SECRET;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signaturePayload)
    );

    const signature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // ✅ Build final payload
    const payload = {
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip: req.headers.get("cf-connecting-ip") || "",
      user_agent: req.headers.get("user-agent") || "",
      session_id: body.session_id || crypto.randomUUID(),
      device_session_id: body.device_session_id || crypto.randomUUID(),
      account_creation_url: "https://car.financecheque.uk/claim",
      addresses,
      signature,
    };

    // 🔍 Debug logs (keep these for now)
    console.log("--- OUTGOING REQUEST ---");
    console.log("Signature Payload:", signaturePayload);
    console.log("Signature:", signature);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // ✅ Send to R2R
    const res = await fetch(
      "https://r2r.theclaimsystem.co.uk/api/v1/affiliate/a4429cda-e36a-472a-8291-ae01a49349d8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await res.text();

    console.log("--- UPSTREAM RESPONSE ---");
    console.log("Status:", res.status);
    console.log("Body:", text);

    // ✅ Always return JSON to browser
    return new Response(
      JSON.stringify({
        status: res.status,
        body: safeJsonParse(text),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: res.status,
      }
    );
  } catch (err: any) {
    console.error("SERVER ERROR:", err);

    return new Response(
      JSON.stringify({
        error: err.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ✅ Safe JSON parse helper
function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

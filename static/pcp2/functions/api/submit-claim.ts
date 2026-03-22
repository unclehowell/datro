export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    // ✅ Parse request (supports form-data + JSON)
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

    // ✅ Addresses MUST be an array
    const addresses = [
      {
        buildingNumber: buildingNumber || null,
        buildingName: null,
        thoroughfare,
        townOrCity,
        postcode,
        line1: null,
        line2: null,
        line3: null,
        line4: null,
        district: null,
      },
    ];

    // ✅ Signature payload (ONLY these fields)
    const signaturePayload = JSON.stringify({
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      addresses,
    });

    // ✅ Signature = BASE64(JSON STRING)  ← THIS IS THE KEY FIX
    const signature = btoa(signaturePayload);

    // ✅ Final payload
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

    // 🔍 Debug logs
    console.log("--- OUTGOING REQUEST ---");
    console.log("Signature Payload:", signaturePayload);
    console.log("Signature:", signature);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // ✅ Send request to R2R
    const res = await fetch(
      "https://r2r.theclaimsystem.co.uk/api/v1/affiliate/a4429cda-e36a-472a-8291-ae01a49349d8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "API-KEY": context.env.VITE_API_KEY, // ✅ REQUIRED
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
        status: res.status,
        headers: { "Content-Type": "application/json" },
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

// ✅ Safe JSON parser
function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

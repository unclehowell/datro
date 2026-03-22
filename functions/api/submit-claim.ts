export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    // -------------------------
    // ✅ Parse request
    // -------------------------
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    // -------------------------
    // ✅ RAW INPUT (NO MUTATION)
    // -------------------------
    const title = String(body.title || "").trim();
    const first_name = String(body.first_name || "").trim();
    const last_name = String(body.last_name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const date_of_birth = String(body.date_of_birth || "").trim();

    const buildingNumber = String(body.buildingNumber || "").trim();
    const thoroughfare = String(body.thoroughfare || "").trim();
    const townOrCity = String(body.townOrCity || "").trim();
    const postcode = String(body.postcode || "").trim();

    // -------------------------
    // ✅ ADDRESS = ARRAY OF OBJECTS
    // -------------------------
    const addresses = [
      {
        buildingNumber,
        thoroughfare,
        townOrCity,
        postcode,
      },
    ];

    // -------------------------
    // ✅ SIGNATURE PAYLOAD (MATCH EXACTLY)
    // -------------------------
    const signaturePayloadObj = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      addresses,
    };

    const signaturePayload = JSON.stringify(signaturePayloadObj);

    // -------------------------
    // ✅ UTF-8 SAFE BASE64
    // -------------------------
    const utf8 = new TextEncoder().encode(signaturePayload);
    let binary = "";
    utf8.forEach((b) => (binary += String.fromCharCode(b)));
    const signature = btoa(binary);

    // -------------------------
    // ✅ FINAL PAYLOAD
    // -------------------------
    const payload = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip: req.headers.get("cf-connecting-ip") || "",
      user_agent: req.headers.get("user-agent") || "",
      session_id: body.session_id || crypto.randomUUID(),
      device_session_id:
        body.device_session_id || body.session_id || crypto.randomUUID(),
      account_creation_url: "https://car.financecheque.uk/claim",
      addresses,
      signature,
    };

    // -------------------------
    // 🔍 DEBUG LOGS
    // -------------------------
    console.log("--- OUTGOING REQUEST ---");
    console.log("Signature Payload:", signaturePayload);
    console.log("Signature:", signature);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // -------------------------
    // ✅ SEND TO R2R
    // -------------------------
    const res = await fetch(
      "https://r2r.theclaimsystem.co.uk/api/v1/affiliate/a4429cda-e36a-472a-8291-ae01a49349d8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "API-KEY": context.env.VITE_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await res.text();

    console.log("--- UPSTREAM RESPONSE ---");
    console.log("Status:", res.status);
    console.log("Body:", text);

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

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

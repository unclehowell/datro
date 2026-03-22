async function onRequestPost(context) {
  const { request, env } = context;

  const affiliateId =
    env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";

  const apiKey =
    env.VITE_API_KEY || "8714de54-a64d-441b-8ef9-4a64318380b0";

  try {
    // Parse incoming form
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const client_ip =
      request.headers.get("cf-connecting-ip") || "0.0.0.0";

    const user_agent =
      data.user_agent ||
      data.useragent ||
      request.headers.get("user-agent") ||
      "";

    const session_id =
      data.session_id ||
      data.sessionid ||
      data.device_session_id ||
      crypto.randomUUID();

    // ✅ NORMALIZE INPUTS
    const first_name = (data.firstname || data.first_name || "").trim();
    const last_name = (data.lastname || data.last_name || "").trim();
    const date_of_birth = (data.dateofbirth || data.date_of_birth || "").trim();
    const phone = (data.phone || "").trim();
    const email = (data.email || "").trim();

    const address = {
      buildingNumber: (data.buildingNumber || "").trim(),
      thoroughfare: (data.thoroughfare || "").trim(),
      townOrCity: (data.townOrCity || "").trim(),
      postcode: (data.postcode || "").toUpperCase().trim(),
    };

    // ✅ FINAL PAYLOAD (addresses MUST be array)
    const payload: any = {
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip,
      user_agent,
      session_id,
      device_session_id: session_id,
      account_creation_url: "https://car.financecheque.uk/claim",
      addresses: [address],
    };

    // ✅ SIGNATURE PAYLOAD (must match exactly)
    const signaturePayload = JSON.stringify({
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      addresses: [address],
    });

    payload.signature = await generateSignature(signaturePayload, apiKey);

    console.log("--- OUTGOING REQUEST TO UPSTREAM ---");
    const url = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;
    console.log("URL:", url);
    console.log("Signature Payload:", signaturePayload);
    console.log("Signature:", payload.signature);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    console.log("--- UPSTREAM RESPONSE ---");
    console.log("Status:", response.status);

    const text = await response.text();
    console.log("Body:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return new Response(JSON.stringify(json), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("ERROR:", err);

    return new Response(
      JSON.stringify({
        message: "Internal Server Error",
        error: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 🔐 HMAC SHA256 SIGNATURE
async function generateSignature(payload: string, secret: string) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

return Array.from(new Uint8Array(sigBuffer))
  .map(b => b.toString(16).padStart(2, "0"))
  .join("");
}

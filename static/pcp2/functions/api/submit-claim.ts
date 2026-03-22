export async function onRequestPost(context) {
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

    // ✅ Correct payload structure (NO array for addresses)
    const payload: any = {
      first_name: data.firstname || data.first_name || data.firstName,
      last_name: data.lastname || data.last_name || data.lastName,
      date_of_birth: data.dateofbirth || data.date_of_birth,
      phone: data.phone,
      email: data.email,
      client_ip,
      user_agent,
      session_id,
      device_session_id: session_id,
      account_creation_url: "https://car.financecheque.uk/claim",
      addresses: {
        buildingNumber: data.buildingNumber || "",
        thoroughfare: data.thoroughfare || "",
        townOrCity: data.townOrCity || "",
        postcode: data.postcode || "",
      },
    };

    // ✅ Build signature payload (ONLY required fields)
    const signaturePayload = JSON.stringify({
      first_name: payload.first_name,
      last_name: payload.last_name,
      date_of_birth: payload.date_of_birth,
      phone: payload.phone,
      email: payload.email,
      addresses: payload.addresses,
    });

    // ✅ Generate HMAC SHA256 signature
    payload.signature = await generateSignature(signaturePayload, apiKey);

    console.log("--- OUTGOING REQUEST TO UPSTREAM ---");
    const upstreamUrl = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;
    console.log("URL:", upstreamUrl);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // ✅ Clean headers (ONLY what’s needed)
    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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
  } catch (error: any) {
    console.error("ERROR:", error);

    return new Response(
      JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 🔐 HMAC SHA256 SIGNATURE FUNCTION
async function generateSignature(payload: string, secret: string) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );
}

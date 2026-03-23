export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    // -------------------------
    // Helpers
    // -------------------------
    const formatDOB = (input: string) => {
      const [day, month, year] = input.split("/");
      return `${year}-${month}-${day}`;
    };

    const formatPhone = (phone: string) => {
      const clean = phone.replace(/\s+/g, "");
      return clean.startsWith("0") ? "+44" + clean.slice(1) : clean;
    };

    // -------------------------
    // Raw values
    // -------------------------
    const title = String(body.title || "").trim();
    const first_name = String(body.first_name || "").trim();
    const last_name = String(body.last_name || "").trim();
    const email = String(body.email || "").trim();
    const phone = formatPhone(String(body.phone || "").trim());
    const date_of_birth = formatDOB(String(body.date_of_birth || "").trim());

    const buildingNumber = String(body.buildingNumber || "").trim();
    const thoroughfare = String(body.thoroughfare || "").trim();
    const townOrCity = String(body.townOrCity || "").trim();
    const postcode = String(body.postcode || "").trim();

    // -------------------------
    // ADDRESS SPLIT STRATEGY
    // -------------------------

    // 🔹 For SIGNATURE (object)
    const addressForSignature = {
      buildingNumber,
      thoroughfare,
      townOrCity,
      postcode,
    };

    // 🔹 For PAYLOAD (array)
    const addressForPayload = [
      {
        buildingNumber,
        thoroughfare,
        townOrCity,
        postcode,
      },
    ];

    // -------------------------
    // 🔒 LOCKED SIGNATURE ORDER
    // -------------------------
    const signaturePayload =
      `{"title":"${title}","first_name":"${first_name}","last_name":"${last_name}","date_of_birth":"${date_of_birth}","phone":"${phone}","email":"${email}","addresses":${JSON.stringify(addressForSignature)}}`;

    const signature = btoa(
      new TextEncoder()
        .encode(signaturePayload)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // -------------------------
    // FINAL PAYLOAD
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
      session_id: crypto.randomUUID(),
      device_session_id: body.device_session_id || crypto.randomUUID(),
      account_creation_url: "https://car.financecheque.uk/claim",

      addresses: addressForPayload,

      // 🔴 VERY IMPORTANT
      opt_in: true,

      signature,
    };

    console.log("SIGNATURE STRING:", signaturePayload);
    console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    const res = await fetch(
      "https://r2r.theclaimsystem.co.uk/api/v1/affiliate/a4429cda-e36a-472a-8291-ae01a49349d8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "API-KEY": context.env.VITE_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await res.text();

    console.log("R2R STATUS:", res.status);
    console.log("R2R BODY:", text);

    return new Response(text, { status: res.status });

  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}

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
    // ✅ Helpers
    // -------------------------

    // Robust DOB formatter (handles DD/MM/YYYY and YYYY-MM-DD)
    const formatDOB = (input: string) => {
      if (!input) return "";

      // Already correct
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
      }

      // Convert DD/MM/YYYY
      if (input.includes("/")) {
        const [day, month, year] = input.split("/");
        if (!day || !month || !year) return input;

        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      return input;
    };

    // UK phone normalization
    const formatPhone = (phone: string) => {
      const clean = phone.replace(/\s+/g, "");
      if (clean.startsWith("0")) {
        return "+44" + clean.slice(1);
      }
      return clean;
    };

    // -------------------------
    // ✅ Raw input (NO mutation beyond formatting)
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
    // ✅ Address handling
    // -------------------------

    // Signature expects OBJECT
    const addressForSignature = {
      buildingNumber,
      thoroughfare,
      townOrCity,
      postcode,
    };

    // Payload expects ARRAY
    const addressForPayload = [
      {
        buildingNumber,
        thoroughfare,
        townOrCity,
        postcode,
      },
    ];

    // -------------------------
    // ✅ Signature (STRICT ORDER)
    // -------------------------
    const signaturePayload =
      `{"title":"${title}","first_name":"${first_name}","last_name":"${last_name}","date_of_birth":"${date_of_birth}","phone":"${phone}","email":"${email}","addresses":${JSON.stringify(addressForSignature)}}`;

    const signature = btoa(
      new TextEncoder()
        .encode(signaturePayload)
        .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );

    // -------------------------
    // ✅ Session IDs
    // -------------------------
    const session_id = body.session_id || crypto.randomUUID();
    const device_session_id =
      body.device_session_id || crypto.randomUUID();

    // -------------------------
    // ✅ Final payload
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
      session_id,
      device_session_id,
      account_creation_url: "https://car.financecheque.uk/claim",
      addresses: addressForPayload,

      // Required (often undocumented)
      opt_in: true,

      signature,
    };

    // -------------------------
    // 🔍 Debug logs
    // -------------------------
    console.log("SIGNATURE STRING:", signaturePayload);
    console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    // -------------------------
    // ✅ Send request
    // -------------------------
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

    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });

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

export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    // -------------------------
    // Parse request
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
    // Helpers
    // -------------------------
    const toBase64 = (str: string) => {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const formatDOB = (d: string) =>
      d.includes("/") ? d.split("/").reverse().join("-") : d;

    const formatPhone = (p: string) =>
      p.startsWith("0") ? "+44" + p.slice(1) : p;

    const formatPostcode = (p: string) => {
      const c = p.replace(/\s+/g, "").toUpperCase();
      return c.length >= 5 ? c.slice(0, -3) + " " + c.slice(-3) : c;
    };

    // -------------------------
    // Clean input
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
    const postcode = formatPostcode(String(body.postcode || "").trim());

    // -------------------------
    // 🚨 REQUIRED WEIRD STRUCTURE
    // -------------------------
    const addressBlock = {
      thoroughfare,
      townOrCity,
      postcode,
    };

    const addresses = {
      buildingNumber: addressBlock,
      thoroughfare: addressBlock,
      townOrCity: addressBlock,
      postcode: addressBlock,
    };

    // -------------------------
    // Session IDs
    // -------------------------
    const session_id = body.session_id || crypto.randomUUID();
    const device_session_id =
      body.device_session_id || crypto.randomUUID();

    // -------------------------
    // Signature (EXACT MATCH)
    // -------------------------
    const signatureObject = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      addresses,
    };

    const signature = toBase64(JSON.stringify(signatureObject));

    // -------------------------
    // Final payload
    // -------------------------
    const payload = {
      ...signatureObject,
      client_ip: req.headers.get("cf-connecting-ip") || "",
      user_agent: req.headers.get("user-agent") || "",
      session_id,
      device_session_id,
      account_creation_url: "https://car.financecheque.uk/claim",
      opt_in: true,
      signature,
    };

    console.log("PAYLOAD:", JSON.stringify(payload, null, 2));

    const res = await fetch(
      "https://r2r.theclaimsystem.co.uk/api/v1/affiliate/a4429cda-e36a-472a-8291-ae01a49349d8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

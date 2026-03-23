export async function submitClaim(formData) {
  try {
    // -----------------------------
    // 1. Extract + sanitize fields
    // -----------------------------
    const title = formData.title?.trim();
    const first_name = formData.first_name?.trim();
    const last_name = formData.last_name?.trim();
    const date_of_birth = formData.date_of_birth;
    const phone = formData.phone?.trim();
    const email = formData.email?.trim();

    const buildingNumber = formData.buildingNumber?.trim();
    const thoroughfare = formData.thoroughfare?.trim();
    const townOrCity = formData.townOrCity?.trim();
    const postcode = formData.postcode?.trim();

    // -----------------------------
    // 2. Validation
    // -----------------------------
    const missing = [];
    if (!title) missing.push("title");
    if (!first_name) missing.push("first_name");
    if (!last_name) missing.push("last_name");
    if (!date_of_birth) missing.push("date_of_birth");
    if (!phone) missing.push("phone");
    if (!email) missing.push("email");
    if (!buildingNumber) missing.push("buildingNumber");
    if (!thoroughfare) missing.push("thoroughfare");
    if (!townOrCity) missing.push("townOrCity");
    if (!postcode) missing.push("postcode");

    if (missing.length) {
      throw new Error(`Missing fields: ${missing.join(", ")}`);
    }

    // -----------------------------
    // 3. Address (correct structure)
    // -----------------------------
    const addressForPayload = {
      buildingNumber,
      thoroughfare,
      townOrCity,
      postcode,
    };

    // -----------------------------
    // 4. Signature (EXACT MATCH)
    // -----------------------------
    const signatureObject = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      addresses: addressForPayload,
    };

    const signatureString = JSON.stringify(signatureObject);

    const signature = btoa(
      new TextEncoder()
        .encode(signatureString)
        .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );

    console.log("SIGNATURE STRING:", signatureString);
    console.log("SIGNATURE:", signature);

    // -----------------------------
    // 5. Final payload
    // -----------------------------
    const payload = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip: "",
      user_agent: navigator.userAgent,
      session_id: crypto.randomUUID(),
      device_session_id: crypto.randomUUID(),
      account_creation_url: window.location.href,
      addresses: addressForPayload,
      opt_in: true,
      signature,
    };

    console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    // -----------------------------
    // 6. SEND DIRECTLY TO R2R API
    // -----------------------------
    const response = await fetch(import.meta.env.VITE_R2R_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    const contentType = response.headers.get("content-type") || "";

    console.log("STATUS:", response.status);
    console.log("RAW RESPONSE:", raw);

    // -----------------------------
    // 7. Handle response
    // -----------------------------
    if (!contentType.includes("application/json")) {
      throw new Error(
        `Non-JSON response (${response.status}): ${raw || "empty"}`
      );
    }

    const data = JSON.parse(raw);

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        "Submission rejected by upstream API"
      );
    }

    return data;

  } catch (error) {
    console.error("--- SUBMISSION ERROR ---", error);
    throw error;
  }
}

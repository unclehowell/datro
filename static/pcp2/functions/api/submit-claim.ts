export async function submitClaim(formData) {
  try {
    // -----------------------------
    // 1. Extract fields
    // -----------------------------
    const {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      buildingNumber,
      thoroughfare,
      townOrCity,
      postcode,
    } = formData;

    // -----------------------------
    // 2. Build address (FLAT - critical)
    // -----------------------------
    const addressForPayload = {
      buildingNumber: buildingNumber?.trim(),
      thoroughfare: thoroughfare?.trim(),
      townOrCity: townOrCity?.trim(),
      postcode: postcode?.trim(),
    };

    // -----------------------------
    // 3. Build signature object (MUST MATCH API EXACTLY)
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

    console.log("SIGNATURE STRING:", signatureString);

    // -----------------------------
    // 4. Proper browser-safe base64
    // -----------------------------
    const signature = btoa(
      new TextEncoder()
        .encode(signatureString)
        .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );

    console.log("SIGNATURE:", signature);

    // -----------------------------
    // 5. Build final payload
    // -----------------------------
    const payload = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip: "", // let backend fill if needed
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
    // 6. Send request
    // -----------------------------
    const response = await fetch("/api/submit-claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    console.log("STATUS:", response.status);
    console.log("RESPONSE:", text);

    if (!response.ok) {
      throw new Error("Submission rejected by server");
    }

    return JSON.parse(text);

  } catch (error) {
    console.error("--- SUBMISSION ERROR ---", error);
    throw error;
  }
}

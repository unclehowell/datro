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
    // 2. Basic validation (prevents API rejection)
    // -----------------------------
    if (
      !title ||
      !first_name ||
      !last_name ||
      !date_of_birth ||
      !phone ||
      !email ||
      !buildingNumber ||
      !thoroughfare ||
      !townOrCity ||
      !postcode
    ) {
      throw new Error("Missing required fields");
    }

    // -----------------------------
    // 3. Build address (FLAT - required)
    // -----------------------------
    const addressForPayload = {
      buildingNumber,
      thoroughfare,
      townOrCity,
      postcode,
    };

    // -----------------------------
    // 4. Build signature object (MUST MATCH EXACTLY)
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
    // 5. Browser-safe base64 encoding
    // -----------------------------
    const signature = btoa(
      new TextEncoder()
        .encode(signatureString)
        .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );

    console.log("SIGNATURE:", signature);

    // -----------------------------
    // 6. Build final payload
    // -----------------------------
    const payload = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip: "", // backend can populate
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
    // 7. Send request
    // -----------------------------
    const response = await fetch("/api/submit-claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    console.log("STATUS:", response.status);
    console.log("RAW RESPONSE:", raw);

    // -----------------------------
    // 8. Handle non-JSON responses (fixes your 405 crash)
    // -----------------------------
    if (!contentType.includes("application/json")) {
      throw new Error(
        `Server returned non-JSON response (${response.status}): ${raw}`
      );
    }

    const data = JSON.parse(raw);

    if (!response.ok) {
      throw new Error(
        data?.error || data?.message || "Submission rejected by server"
      );
    }

    return data;

  } catch (error) {
    console.error("--- SUBMISSION ERROR ---", error);
    throw error;
  }
}

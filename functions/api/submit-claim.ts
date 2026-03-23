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
    // 2. Validation (strict + explicit)
    // -----------------------------
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!first_name) missingFields.push("first_name");
    if (!last_name) missingFields.push("last_name");
    if (!date_of_birth) missingFields.push("date_of_birth");
    if (!phone) missingFields.push("phone");
    if (!email) missingFields.push("email");
    if (!buildingNumber) missingFields.push("buildingNumber");
    if (!thoroughfare) missingFields.push("thoroughfare");
    if (!townOrCity) missingFields.push("townOrCity");
    if (!postcode) missingFields.push("postcode");

    if (missingFields.length) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // -----------------------------
    // 3. Build address (STRICT FLAT OBJECT)
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
    // 5. Stable base64 encoding (browser-safe, no corruption)
    // -----------------------------
    const signature = btoa(
      new TextEncoder()
        .encode(signatureString)
        .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );

    console.log("SIGNATURE:", signature);

    // -----------------------------
    // 6. Build final payload (IDENTICAL STRUCTURE)
    // -----------------------------
    const payload = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip: "", // allow backend to populate
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
    // 7. Send request (with timeout + better failure handling)
    // -----------------------------
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response;

    try {
      response = await fetch("/api/submit-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (networkError) {
      clearTimeout(timeout);

      if (networkError.name === "AbortError") {
        throw new Error("Request timed out");
      }

      throw new Error("Network error while submitting claim");
    }

    clearTimeout(timeout);

    // -----------------------------
    // 8. Read response safely
    // -----------------------------
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    console.log("STATUS:", response.status);
    console.log("RAW RESPONSE:", raw);

    // -----------------------------
    // 9. Handle 405 explicitly (your current issue)
    // -----------------------------
    if (response.status === 405) {
      throw new Error(
        "Endpoint does not accept POST (405). Cloudflare function likely missing onRequestPost."
      );
    }

    // -----------------------------
    // 10. Handle non-JSON responses safely
    // -----------------------------
    if (!contentType.includes("application/json")) {
      throw new Error(
        `Server returned non-JSON response (${response.status}): ${raw || "empty response"}`
      );
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Invalid JSON response from server");
    }

    // -----------------------------
    // 11. Handle API errors properly
    // -----------------------------
    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        JSON.stringify(data) ||
        "Submission rejected by server"
      );
    }

    // -----------------------------
    // 12. Success
    // -----------------------------
    return data;

  } catch (error) {
    console.error("--- SUBMISSION ERROR ---", error);
    throw error;
  }
}

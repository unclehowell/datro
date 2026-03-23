// Frontend helper — lives in your React/Vite src folder
// Calls YOUR Cloudflare Function at /api/submit-claim, NOT R2R directly.
// The Cloudflare Function (submit-claim.ts) handles API keys and forwards to R2R.

export async function submitClaim(formData: Record<string, string>) {
  // ── 1. Extract + sanitize ──────────────────────────────────────
  const title          = formData.title?.trim() ?? "";
  const first_name     = formData.first_name?.trim() ?? "";
  const last_name      = formData.last_name?.trim() ?? "";
  const date_of_birth  = formData.date_of_birth?.trim() ?? "";
  const phone          = formData.phone?.trim() ?? "";
  const email          = formData.email?.trim() ?? "";
  const buildingNumber = formData.buildingNumber?.trim() ?? "";
  const thoroughfare   = formData.thoroughfare?.trim() ?? "";
  const townOrCity     = formData.townOrCity?.trim() ?? "";
  const postcode       = formData.postcode?.trim() ?? "";
  const session_id     = formData.session_id ?? crypto.randomUUID();
  const device_session_id = formData.device_session_id ?? crypto.randomUUID();

  // ── 2. Validation ──────────────────────────────────────────────
  const missing: string[] = [];
  if (!title)          missing.push("title");
  if (!first_name)     missing.push("first_name");
  if (!last_name)      missing.push("last_name");
  if (!date_of_birth)  missing.push("date_of_birth");
  if (!phone)          missing.push("phone");
  if (!email)          missing.push("email");
  if (!buildingNumber) missing.push("buildingNumber");
  if (!thoroughfare)   missing.push("thoroughfare");
  if (!townOrCity)     missing.push("townOrCity");
  if (!postcode)       missing.push("postcode");

  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  // ── 3. Build payload ───────────────────────────────────────────
  // NOTE: signature generation happens server-side in the Cloudflare Function.
  // We just forward everything needed.
  const payload = {
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
    session_id,
    device_session_id,
  };

  console.log("--- BROWSER: SENDING PAYLOAD ---");
  console.log(JSON.stringify(payload, null, 2));

  // ── 4. POST to Cloudflare Function (same-origin, no CORS issues) ──
  const response = await fetch("/api/submit-claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  console.log("--- BROWSER: RESPONSE ---");
  console.log("Status:", response.status);
  console.log("Body:", raw);

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Server returned non-JSON response (${response.status}): ${raw || "empty"}`
    );
  }

  const data = JSON.parse(raw);

  if (!response.ok) {
    throw new Error(
      data?.error ?? data?.message ?? "Submission rejected by server"
    );
  }

  return data;
}

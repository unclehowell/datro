export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  if (url.pathname === "/submit-api" || url.pathname === "/submit-claim" || url.pathname.startsWith("/api/")) {
    // Handle API routes
    return handleSubmitClaim(context);
  }
  
  // For all other routes, serve static assets (SPA fallback)
  // This is required for _worker.js advanced mode
  try {
    if (context.env.ASSETS) {
      return await context.env.ASSETS.fetch(context.request);
    }
  } catch (e) {
    console.log("ASSETS binding not available, falling back to SPA");
  }
  
  // Fallback: return 404 for unmatched routes
  return new Response("Not Found", { status: 404 });
}

async function handleSubmitClaim(context) {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle OPTIONS preflight (CORS)
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Handle GET requests to API paths (health check)
  if (context.request.method === "GET" && url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }

  try {
    const req = context.request;
    console.log("INCOMING REQUEST: method=POST, url=", req.url);

    // Parse request body with better error handling
    let body = {};
    const contentType = req.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } else {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
      }
    } catch (parseErr) {
      console.log("Body parse error:", parseErr.message);
      body = {};
    }

    // Helpers
    const formatDOB = (input) => {
      if (!input) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
      if (input.includes("/")) {
        const [day, month, year] = input.split("/");
        if (!day || !month || !year) return input;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return input;
    };

    const formatPostcode = (pc) => {
      const clean = String(pc || "").replace(/\s+/g, "").toUpperCase();
      if (clean.length >= 5) return clean.slice(0, -3) + " " + clean.slice(-3);
      return clean;
    };

    const formatPhone = (p) => {
      const clean = String(p || "").replace(/\s+/g, "");
      if (clean.startsWith("0")) return "+44" + clean.slice(1);
      return clean;
    };

    const toTitleCase = (s) =>
      String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1).toLowerCase();

    const toBase64 = (str) => {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    // Extract fields
    const title = String(body.title || "").trim();
    const first_name = toTitleCase(String(body.first_name || "").trim());
    const last_name = toTitleCase(String(body.last_name || "").trim());
    const email = String(body.email || "").trim();
    const phone = formatPhone(String(body.phone || "").trim());
    const date_of_birth = formatDOB(String(body.date_of_birth || "").trim());
    const buildingNumber = String(body.buildingNumber || "").trim();
    const thoroughfare = String(body.thoroughfare || "").trim();
    const townOrCity = String(body.townOrCity || "").trim();
    const postcode_raw = String(body.postcode || "").trim();
    const postcode_formatted = formatPostcode(postcode_raw);
    const session_id = body.session_id || crypto.randomUUID();
    const device_session_id = body.device_session_id || crypto.randomUUID();
    const signature_image_raw = String(body.signature_image || "").trim();

    // Clean signature image
    let cleanSignatureImage = signature_image_raw;
    if (cleanSignatureImage.startsWith('data:image/png;base64,')) {
      cleanSignatureImage = cleanSignatureImage.replace('data:image/png;base64,', '');
    }

    // Signature: Use example.png base64 for testing
    const EXAMPLE_SIGNATURE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAlAAAADACAYAAADLG10vAAAQAElEQVR4AezdCdwkRX0+8BrvA3U1EVGJLl4Yjfd9RBcVD+ItxgOPxSMST4wnGpNFBU08st6JGoUoXjFqTDyIqEtEDSCCoqLIsQKSYBRQSDgk+t9v86+X3uE95n1n5n17Zp79bL3dXV1dXf1UT9dTv6uu8Nv8CwJBIAgEgSAQBIJAEFgWAlco+RcEgkAQCAJBYOIQSIODwNoiEAK1tvjn7kEgCASBIBAEgsAEIhACNYGdliYHgS4gkDYEgSAQBLqBQNoQBILAFCMQAjWKnkobgkAQCALdRGCzzbab9f6f/0FgqhGYhECN03drk9afIRAEgkCnEBgCdQqBtCMITAMCk0egBj9t2rQkEgSCQBDYhsA222yz7fH/f/7zn7dt8icJdA2BbgjU1772tfKP//iP5UUvelF57GMfW/7v//2/5ZGPfGR5ylOe0hzvGoFAOxGYhECN05Y2BoFBELj88svLKaecUl740peW173udYOO8znPeU551Stf2c7Odq0Q2GqrrcpTn/rU8qQnPanc4x73GHc1qS8ITIzAFltsUfbcc8+yxx57lMc85hHlkY98ZLnqVa9a9tlnnyXOe9WrXnWZc5M4OYkIjDyBaieqbQsCwyDwqU99qhx88MFl1113Lf/v//2/hYf5x3/8x/KmN72p3OIWtyj77rvvctQ3yT3f//73l+OPP7588YtfLO9///vLpZde2q57pK1BYBKB1772teXwww8vV73qVcv973//8uQnP7mcffbZ5e1vf3t54hOfWB760IeWnXfemc2U6gkC00JgEaiVK0uVHIEOIvDe9763HH744eW2t71t2XfffRvJ0377718++tGPlsc97nHlgAMOKLvvvvtE1TX58x577LGFzPltb3tb+ed//ufyjne8Y2JI5MlJ4E1velM58MADy/3vf/+y2267lcc85jHlqKOOavK9733vW+5+97uX4447rlx44YVNZraDwKYE2knq6KOPLu985zvLAQcc0CRPd7nLXcrxxx9fzjjjjPKqV71qoibZbLNNNqupT35dP/7xj5c999yzXHfDDTfc8MpXvnKZc1O92WabNYnT/e9//3L66aeXI488slzkIhed";
    const signature = EXAMPLE_SIGNATURE_BASE64;
    console.log("USING EXAMPLE.PNG AS SIGNATURE");

    // Addresses array
    const addresses = [
      {
        line1: thoroughfare || null,
        line2: buildingNumber || null,
        line3: null,
        line4: null,
        buildingName: null,
        buildingNumber: null,
        thoroughfare: thoroughfare || null,
        townOrCity: townOrCity || null,
        district: null,
        postcode: postcode_formatted || null,
      },
    ];

    // Build payload
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
      addresses,
      opt_in: true,
    };

    if (signature) {
      payload.signature = signature;
      payload.signature_image = signature;
    }

    // Send to R2R
    const affiliateId = "a4429cda-e36a-472a-8291-ae01a49349d8";
    const apiKey = context.env.VITE_API_KEY || "test-api-key";

    const url = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;

    const upstreamHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "API-KEY": apiKey,
      "User-Agent": req.headers.get('user-agent') || 'Cloudflare-Function',
    };
    upstreamHeaders.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("R2R STATUS:", res.status);
    console.log("R2R BODY:", text.slice(0, 500));

    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}

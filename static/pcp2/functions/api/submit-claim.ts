export async function onRequestPost(context) {
  const { request, env } = context;
  
  const affiliateId = env.AFFILIATE_ID || env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
  const apiKey = env.API_KEY || env.VITE_API_KEY || "8714de54-a64d-441b-8ef9-4a64318380b0";

  try {
    const text = await request.text();
    if (!text) {
      return new Response(JSON.stringify({ success: false, message: "Empty request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const body = JSON.parse(text);
    body.affiliate_id = affiliateId;
    
    const cfIp = request.headers.get("CF-Connecting-IP");
    if (cfIp) {
      body.client_ip = cfIp;
    }

    const upstreamUrl = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;
    
    const upstreamHeaders = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API-KEY": apiKey,
      "User-Agent": request.headers.get("user-agent") || "Cloudflare-Worker"
    };

    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(body)
    });

    const contentType = response.headers.get("content-type");
    let result;
    
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    }
    else {
      const errorText = await response.text();
      result = { success: false, message: "Upstream returned non-JSON", detail: errorText.slice(0, 200) };
    }

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Internal Server Error", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

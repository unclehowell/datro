export async function onRequestPost(context) {
  const { request, env } = context;
  
  const affiliateId = env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
  const apiKey = env.VITE_API_KEY || "8714de54-a64d-441b-8ef9-4a64318380b0";

  try {
    const text = await request.text();
    if (!text) {
      return new Response(JSON.stringify({ message: "Empty request body" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const body = JSON.parse(text);
    body.affiliate_id = affiliateId;
    
    // Use Cloudflare's connecting IP if available to ensure accuracy
    const cfIp = request.headers.get('CF-Connecting-IP');
    if (cfIp) {
      console.log("Using CF-Connecting-IP:", cfIp);
      body.client_ip = cfIp;
    }

    console.log("--- OUTGOING REQUEST TO UPSTREAM ---");
    const upstreamUrl = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;
    console.log("URL:", upstreamUrl);
    console.log("Affiliate ID:", affiliateId);
    console.log("API Key (masked):", apiKey.slice(0, 4) + "..." + apiKey.slice(-4));
    console.log("Payload:", JSON.stringify(body, null, 2));

    const upstreamHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'API-KEY': apiKey,
      'User-Agent': request.headers.get('user-agent') || 'Cloudflare-Worker'
    };
    console.log("Upstream Headers (masked key):", { ...upstreamHeaders, 'API-KEY': '***' });

    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(body)
    });

    console.log("--- UPSTREAM RESPONSE ---");
    console.log("Status:", response.status);

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const resText = await response.text();
      console.log("Body:", resText);
      
      if (!resText) {
        return new Response(JSON.stringify({ message: "Empty response from upstream" }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      try {
        const result = JSON.parse(resText);
        return new Response(JSON.stringify(result), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ message: "Invalid JSON from upstream", error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      const resText = await response.text();
      console.log("Non-JSON Body:", resText);
      return new Response(JSON.stringify({ message: `Upstream error: ${resText.slice(0, 100)}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: "Internal Server Error", error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

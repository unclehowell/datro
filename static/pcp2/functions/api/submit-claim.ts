export async function onRequestPost(context) {
  const { request, env } = context;
  
  const affiliateId = env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
  const apiKey = env.VITE_API_KEY || "8714de54-a64d-441b-8ef9-4a64318380b0";

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const client_ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
    const user_agent = data.user_agent || data.useragent || request.headers.get('user-agent') || '';
    const session_id = data.session_id || data.sessionid || data.device_session_id || crypto.randomUUID();

    const payload: any = {
      first_name: data.firstname || data.first_name || data.firstName,
      last_name: data.lastname || data.last_name || data.lastName,
      date_of_birth: data.dateofbirth || data.date_of_birth,
      phone: data.phone,
      email: data.email,
      client_ip: client_ip,
      user_agent: user_agent,
      session_id: session_id,
      signature: data.signature || '',
      addresses: [
        {
          buildingNumber: data.buildingNumber || '',
          thoroughfare: data.thoroughfare || '',
          townOrCity: data.townOrCity || '',
          postcode: data.postcode || ''
        }
      ]
    };

    // Only generate signature if missing from frontend
    if (!payload.signature) {
      const signaturePayload = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        date_of_birth: payload.date_of_birth,
        phone: payload.phone,
        email: payload.email,
        addresses: [
          {
            buildingNumber: data.buildingNumber || '',
            thoroughfare: data.thoroughfare || '',
            townOrCity: data.townOrCity || '',
            postcode: data.postcode || ''
          }
        ]
      };
      payload.signature = btoa(JSON.stringify(signaturePayload));
    }
    
    // Add ViewThru specific fields
    payload.device_session_id = session_id;
    payload.account_creation_url = 'https://car.financecheque.uk/claim';

    console.log("--- OUTGOING REQUEST TO UPSTREAM ---");
    // Using the real endpoint we had before, but with the new fields
    const upstreamUrl = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;
    console.log("URL:", upstreamUrl);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const upstreamHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'API-KEY': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'X-Affiliate-ID': affiliateId,
      'User-Agent': request.headers.get('user-agent') || 'Cloudflare-Worker'
    };

    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(payload)
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

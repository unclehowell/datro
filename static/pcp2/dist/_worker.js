export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          }
        });
      }
      
      if (request.method === "POST") {
        let body;
        const contentType = request.headers.get("content-type") || "";
        
        console.log("[DEBUG] Content-Type:", contentType);
        
        if (contentType.includes("application/json")) {
          console.log("[DEBUG] Parsing as JSON");
          try {
            body = await request.json();
            console.log("[DEBUG] JSON parsed:", Object.keys(body));
          } catch (e) {
            console.error("[DEBUG] JSON parse error:", e.message);
            return new Response(JSON.stringify({ error: "JSON parse failed: " + e.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
        } else if (contentType.includes("multipart/form-data")) {
          console.log("[DEBUG] Parsing as FormData");
          try {
            const formData = await request.formData();
            console.log("[DEBUG] FormData keys:", Array.from(formData.keys()));
            body = Object.fromEntries(formData.entries());
            console.log("[DEBUG] FormData converted to object");
          } catch (e) {
            console.error("[DEBUG] FormData error:", e.message);
            return new Response(JSON.stringify({ error: "FormData parse failed: " + e.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
        } else {
          console.log("[DEBUG] Unknown content type, trying JSON");
          try {
            body = await request.json();
          } catch (e) {
            return new Response(JSON.stringify({ error: "Unsupported content-type: " + contentType }), {
              status: 400,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
        }
        
        try {
          const clientIp = request.headers.get('CF-Connecting-IP') || '1.2.3.4';
          const userAgent = request.headers.get('User-Agent') || 'Mozilla/5.0';
          const sessionId = body.session_id || crypto.randomUUID();
          
          const addresses = body.postcode ? [{
            buildingNumber: body.buildingNumber || null,
            thoroughfare: body.thoroughfare || null,
            townOrCity: body.townOrCity || null,
            postcode: body.postcode || null,
          }] : [];
          
          let signatureWithPrefix = body.signature_image || body.signature || "";
          
          if (signatureWithPrefix && !signatureWithPrefix.startsWith("data:image/png;base64,")) {
            if (signatureWithPrefix.startsWith("data:")) {
              signatureWithPrefix = signatureWithPrefix;
            } else {
              signatureWithPrefix = "data:image/png;base64," + signatureWithPrefix;
            }
          }
          
          const r2rPayload = {
            title: body.title,
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email,
            phone: body.phone,
            date_of_birth: body.date_of_birth,
            addresses: addresses,
            signature: signatureWithPrefix,
            signature_image: signatureWithPrefix,
            client_ip: clientIp,
            user_agent: userAgent,
            session_id: sessionId,
          };
          
          console.log("[DEBUG] Sending to R2R API");
          
          const affiliateId = "a4429cda-e36a-472a-8291-ae01a49349d8";
          const apiKey = env.VITE_API_KEY || "8714de54-a64d-441b-8ef9-4a64318380b0";
          
          const r2rResponse = await fetch(`https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "API-KEY": apiKey,
            },
            body: JSON.stringify(r2rPayload),
          });
          
          const result = await r2rResponse.text();
          console.log("[DEBUG] R2R response:", result.slice(0, 200));
          
          return new Response(result, {
            status: r2rResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            }
          });
        } catch (err) {
          console.error("[DEBUG] Worker error:", err.message);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }
      
      return new Response(JSON.stringify({ status: "ok", method: request.method }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    return env.ASSETS.fetch(request);
  }
};
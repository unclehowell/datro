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
        try {
          const contentType = request.headers.get("content-type") || "";
          let body;
          
          console.log("Content-Type received:", contentType);
          
          if (contentType.includes("multipart/form-data")) {
            try {
              const formData = await request.formData();
              console.log("FormData parsed successfully");
              body = {
                title: formData.get("title")?.toString() || null,
                first_name: formData.get("first_name")?.toString() || null,
                last_name: formData.get("last_name")?.toString() || null,
                date_of_birth: formData.get("date_of_birth")?.toString() || null,
                phone: formData.get("phone")?.toString() || null,
                email: formData.get("email")?.toString() || null,
                buildingNumber: formData.get("buildingNumber")?.toString() || null,
                thoroughfare: formData.get("thoroughfare")?.toString() || null,
                townOrCity: formData.get("townOrCity")?.toString() || null,
                postcode: formData.get("postcode")?.toString() || null,
                signature: formData.get("signature")?.toString() || null,
                signature_image: formData.get("signature_image")?.toString() || null,
                user_agent: formData.get("user_agent")?.toString() || null,
                session_id: formData.get("session_id")?.toString() || null,
                device_session_id: formData.get("device_session_id")?.toString() || null,
              };
              console.log("FormData body:", JSON.stringify(body));
            } catch (formDataErr) {
              console.error("FormData parse error:", formDataErr.message);
              return new Response(JSON.stringify({ error: "FormData parse failed: " + formDataErr.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
              });
            }
          } else {
            body = await request.json();
          }
          
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
          
          return new Response(result, {
            status: r2rResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            }
          });
        } catch (err) {
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
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
          const body = await request.json();
          
          const clientIp = request.headers.get('CF-Connecting-IP') || '1.2.3.4';
          const userAgent = request.headers.get('User-Agent') || 'Mozilla/5.0';
          const sessionId = crypto.randomUUID();
          
          const addresses = body.postcode ? [{
            buildingNumber: body.buildingNumber || null,
            thoroughfare: body.thoroughfare || null,
            townOrCity: body.townOrCity || null,
            postcode: body.postcode || null,
          }] : [];
          
          // Use example.png as the signature (base64 image) - same for both fields
          const signatureBase64 = "iVBORw0KGgoAAAANSUhEUgAAAlAAAADACAYAAADLG10vAAAQAElEQVR4AezdCdwkRX0+8BrvA3U1EVGJLl4Yjfd9RBcVD+ItxgOPxSMST4wnGpNFBU08st6JGoUoXjFqTDyIqEtEDSCCoqLIsQKSYBRQSDgk+t9v86+X3uE95n1n5n17Zp79bL3dXV1dXf1UT9dTv6uu8Nv8CwJBIAgEgSAQBIJAEFgWAlco+RcEgkAQCAJBYOIQSIODwNoiEAK1tvjn7kEgCASBIBAEgsAEIhACNYGdliYHgS4gkDYEgSAQBLqBQNoQBILAFCMQAjWKnkobgkAQCALdRGCzzbab9f6f/0FgqhGYhECN03drk9afIRAEgkCnEBgCdQqBtCMITAMCk0egBj9t2rQkEgSCQBDYhsA222yz7fH/f/7zn7dt8icJdA2BbgjU1772tfKP//iP5UUvelF57GMfW/7v//2/5ZGPfGR5ylOe0hzvGoFAOxGYhECN05Y2BoFBELj88svLKaecUl740peW173udYOO8znPeU551Stf2c7Odq0Q2GqrrcpTn/rU8qQnPanc4x73GHc1qS8ITIzAFltsUfbcc8+yxx57lMc85hHlkY98ZLnqVa9a9tlnnyXOe9WrXnWZc5M4OYkIjDyBaieqbQsCwyDwqU99qhx88MFl1113Lf/v//2/hYf5x3/8x/KmN72p3OIWtyj77rvvctQ3yT3f//73l+OPP7588YtfLO9///vLpZde2q57pK1BYBKB1772teXwww8vV73qVcv973//8uQnP7mcffbZ5e1vf3t54hOfWB760IeWnXfemc2U6gkC00JgEaiVK0uVHIEOIvDe9763HH744eW2t71t2XfffRvJ0377718++tGPlsc97nHlgAMOKLvvvvtE1TX58x577LGFzPltb3tb+ed//ufyjne8Y2JI5MlJ4E1velM58MADy/3vf/+y2267lcc85jHlqKOOavK9733vW+5+97uX4447rlx44YVNZraDwKYE2knq6KOPLu985zvLAQcc0CRPd7nLXcrxxx9fzjjjjPKqV71qoibZbLNNNqupT35dP/7xj5c999yzXHfDDTfc8MpXvnKZc1O92WabNYnT/e9//3L66aeXI488slzkIhed";
          
          // Try with data URL prefix
          const signatureWithPrefix = "data:image/png;base64," + signatureBase64;
          
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

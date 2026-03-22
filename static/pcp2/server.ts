import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const upload = multer();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for Claim Submission
  app.post("/api/submit-claim", upload.none(), async (req, res) => {
    const affiliateId = process.env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
    const apiKey = process.env.VITE_API_KEY || "8714de54-a64d-441b-8ef9-4a64318380b0";

    try {
      const data = { ...req.body };
      
      const client_ip = (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : (req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress)) || '1.1.1.1';
      const user_agent = data.user_agent || data.useragent || req.headers['user-agent'] || '';
      const session_id = data.session_id || data.sessionid || data.device_session_id || crypto.randomUUID();

      const payload: any = {
        title: data.title || 'Mr',
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
          title: payload.title,
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

      console.log("--- PROXY: PREPARING UPSTREAM REQUEST ---");
      const upstreamUrl = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;
      console.log("Target URL:", upstreamUrl);
      console.log("Affiliate ID used:", affiliateId);
      console.log("API Key present:", !!apiKey);
      console.log("Client IP being sent:", payload.client_ip);
      
      const upstreamHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'X-Affiliate-ID': affiliateId,
        'User-Agent': req.headers['user-agent'] || 'Express-Server',
        'Origin': 'https://car.financecheque.uk',
        'Referer': 'https://car.financecheque.uk/claim'
      };

      const response = await fetch(upstreamUrl, {
        method: 'POST',
        headers: upstreamHeaders,
        body: JSON.stringify(payload)
      });

      console.log("--- PROXY: UPSTREAM RESPONSE RECEIVED ---");
      console.log("Status Code:", response.status);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const resText = await response.text();
        if (!resText) {
          res.status(response.status).json({ message: "Empty response from upstream" });
          return;
        }
        try {
          const result = JSON.parse(resText);
          res.status(response.status).json(result);
        } catch (e: any) {
          res.status(500).json({ message: "Invalid JSON from upstream", error: e.message });
        }
      } else {
        const text = await response.text();
        console.error(`Upstream error (${response.status}):`, text);
        res.status(response.status).json({ message: `Upstream error: ${text.slice(0, 100)}` });
      }
    } catch (error: any) {
      console.error("Proxy Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/auth/url", (req, res) => {
    const appId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL}/auth/callback`;
    
    if (!appId) {
      return res.status(400).json({ error: "FACEBOOK_CLIENT_ID not configured" });
    }

    // Permissions for Ads Management
    const scope = "ads_management,ads_read,business_management,public_profile";
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    
    res.json({ url: authUrl });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    const appId = process.env.FACEBOOK_CLIENT_ID;
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL}/auth/callback`;

    if (!code) {
      return res.send(`
        <html><body><script>
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'No code provided' }, '*');
          window.close();
        </script></body></html>
      `);
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code: code,
        },
      });

      const accessToken = tokenResponse.data.access_token;

      // In a real app, you'd store this in a session/DB. 
      // For this demo, we'll send it back to the client via postMessage.
      // NOTE: In production, use HttpOnly cookies.
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  accessToken: '${accessToken}' 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. Closing window...</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Auth Error:", error.response?.data || error.message);
      res.send(`
        <html><body><script>
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Failed to exchange token' }, '*');
          window.close();
        </script></body></html>
      `);
    }
  });

  // Proxy endpoint for Facebook Graph API
  app.get("/api/fb/*", async (req, res) => {
    const path = req.params[0];
    const accessToken = req.headers.authorization?.split(" ")[1];
    
    if (!accessToken) {
      return res.status(401).json({ error: "Missing access token" });
    }

    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${path}`, {
        params: {
          ...req.query,
          access_token: accessToken,
        },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

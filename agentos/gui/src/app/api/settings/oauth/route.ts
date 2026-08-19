import { NextResponse } from "next/server";
import { OAUTH_AUTH_URL, OAUTH_CLIENT_ENV } from "@/lib/app-catalog";

export const dynamic = "force-dynamic";

const SCOPES: Record<string, string> = {
  "google-gemini":
    "openid email https://www.googleapis.com/auth/cloud-platform",
  "google-tts": "openid email https://www.googleapis.com/auth/cloud-platform",
  "huggingface": "openid profile inference-api",
};

// Kick off an OAuth handshake for an app. The client id lives in the
// server env (registered by the operator), so the browser never sees it —
// this endpoint just redirects to the provider's authorize page.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") || "";
  const clientId = OAUTH_CLIENT_ENV[platform] ? process.env[OAUTH_CLIENT_ENV[platform]] : "";
  const authUrl = OAUTH_AUTH_URL[platform];
  if (!platform || !authUrl) {
    return NextResponse.json({ error: "unknown platform" }, { status: 400 });
  }
  const origin = url.origin;
  const redirectUri = `${origin}/api/oauth/callback?platform=${platform}`;
  const sep = authUrl.includes("?") ? "&" : "?";

  // Without a registered client id we can't complete the handshake — the
  // UI should have fallen back to the API-key path, but guard anyway.
  if (!clientId) {
    return NextResponse.json(
      { error: `No OAuth client id configured (set ${OAUTH_CLIENT_ENV[platform]} in env)` },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state: platform,
    scope: SCOPES[platform] || "openid",
  });
  return NextResponse.redirect(`${authUrl}${sep}${params.toString()}`, 302);
}

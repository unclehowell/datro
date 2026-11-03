import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

// English / Cymraeg / Español dropdown shared by the Great House Farm sites (bucklerfamily.estate/ghf-lang/).
// Loaded after hydration so it never races React's first render.
const GHF_LANG_LOADER = "(function(){function go(){if(document.querySelector('script[src*=\"ghf-lang.js\"]'))return;var s=document.createElement('script');s.src='https://bucklerfamily.estate/ghf-lang/ghf-lang.js';s.setAttribute('data-site','dartboard');s.async=true;document.head.appendChild(s);}function later(){setTimeout(go,600);}if(document.readyState==='complete')later();else window.addEventListener('load',later);})();";

// basecamp.js (the shared bars, footer and location strip) adds nodes to <body>. Written in synchronously by ghf-boot.js
// it ran before React hydrated the page and every load threw React error #418 (hydration mismatch, seen 22 Oct 2026).
// The inert placeholder below (type text/plain: never fetched, never run) makes ghf-boot.js and ghf-lang.js skip
// their own basecamp.js load; BasecampAfterHydration loads it once React has hydrated. ghf-boot.js still runs
// synchronously, so day/night mode and the reserved header band are in place before the first paint.
const BASECAMP_HOLD = "https://bucklerfamily.estate/ghf-lang/basecamp.js?hold";
function BasecampAfterHydration() {
  useEffect(() => {
    const w = window as unknown as { GHFBasecamp?: unknown; GHFBoot?: string };
    if (w.GHFBasecamp || document.querySelector("script[data-ghf-basecamp-late]")) return;
    const s = document.createElement("script");
    s.src = `https://bucklerfamily.estate/ghf-lang/basecamp.js?v=${w.GHFBoot || "2.1.2"}`;
    s.setAttribute("data-ghf-basecamp-late", "");
    document.head.appendChild(s);
  }, []);
  return null;
}

const APP_NAME = "Disclosure Rings";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Concentric rings of every FOI, review and complaint on the Great House Farm case.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,520;9..144,640&family=Outfit:wght@400;500;600&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: GHF_LANG_LOADER }} />
        <script type="text/plain" data-ghf-hold="" src={BASECAMP_HOLD} />
        {/* Header standard v2.1.0: synchronous loader (mode + reserved band before the first paint); its basecamp.js comes after hydration, see BASECAMP_HOLD. */}
        <script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.0" />
      </head>
      <body>
        <PreviewHostBridge />
        <BasecampAfterHydration />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

// English / Cymraeg / Español dropdown shared by the Great House Farm sites (bucklerfamily.estate/ghf-lang/).
// Loaded after hydration so it never races React's first render.
const GHF_LANG_LOADER = "(function(){function go(){if(document.querySelector('script[src*=\"ghf-lang.js\"]'))return;var s=document.createElement('script');s.src='https://bucklerfamily.estate/ghf-lang/ghf-lang.js';s.setAttribute('data-site','dartboard');s.async=true;document.head.appendChild(s);}function later(){setTimeout(go,600);}if(document.readyState==='complete')later();else window.addEventListener('load',later);})();";

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
        {/* Header standard v2.1.0: synchronous loader, so the shared bars are in place before the first paint (React 19 skips nodes it did not render in <body>). */}
        <script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.0" />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Dock from "@/components/Dock";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentOS - UncleHowell",
  description: "Unified AI agent dashboard with Hermes, OmniRoute, and Code Intelligence",
  manifest: "/manifest.json",
  themeColor: "#f59e0b",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AgentOS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('agentos-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.setAttribute('data-theme','dark');}})()`,
          }}
        />
      </head>
      <body className="h-dvh overflow-hidden flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            {children}
          </main>
          <Dock />
        </ThemeProvider>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then((reg) => {
              // WS-05: actively look for a newer service worker on every load so
              // a stale controller (e.g. a v1.11.27-era cache) is replaced on the
              // next visit instead of lingering silently.
              reg.update().catch(() => {});
            }).catch(() => {});
          }`}
        </Script>
      </body>
    </html>
  );
}

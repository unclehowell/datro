import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Dock from "@/components/Dock";
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
    maximumScale: 1,
    userScalable: false,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
       <body className="h-dvh overflow-hidden flex flex-col bg-zinc-950 text-zinc-100">
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          {children}
        </main>
        <Dock />
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }`}
        </Script>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

// The site uses the same OFL font files it serves to the CLI (public/fonts), so no font CDN.
const geist = localFont({
  src: [
    { path: "../public/fonts/geist/Geist-Regular.ttf", weight: "400" },
    { path: "../public/fonts/geist/Geist-Medium.ttf", weight: "500" },
    { path: "../public/fonts/geist/Geist-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/geist/Geist-Bold.ttf", weight: "700" },
  ],
  variable: "--font-geist",
});

const geistMono = localFont({
  src: [
    { path: "../public/fonts/geist-mono/GeistMono-Regular.ttf", weight: "400" },
    { path: "../public/fonts/geist-mono/GeistMono-Medium.ttf", weight: "500" },
  ],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nativecn.dev"),
  title: { default: "nativecn", template: "%s – nativecn" },
  description:
    "shadcn for Expo apps: Components you copy into your app and own, built for AI agents to build and verify mobile apps.",
  openGraph: {
    type: "website",
    siteName: "nativecn",
    title: "nativecn",
    description:
      "shadcn for Expo apps: Components you copy into your app and own, built for AI agents to build and verify mobile apps.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "nativecn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "nativecn",
    description:
      "shadcn for Expo apps: Components you copy into your app and own, built for AI agents to build and verify mobile apps.",
    images: ["/twitter-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0B" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
          >
            Skip to content
          </a>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

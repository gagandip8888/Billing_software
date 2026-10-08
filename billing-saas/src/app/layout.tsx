import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "BillingSaaS - Offline Billing Software for Indian Shops",
    template: "%s | BillingSaaS",
  },
  description:
    "Offline-first billing software for 30+ Indian shop types. Create GST invoices, WhatsApp bills, and reports — works without internet.",
  keywords: [
    "billing software",
    "GST billing",
    "offline billing",
    "invoice software India",
    "shop billing app",
    "Vyapar alternative",
    "myBillBook alternative",
    "POS software India",
    "retail billing app",
  ],
  authors: [{ name: "BillingSaaS" }],
  metadataBase: new URL("https://billingsaas.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://billingsaas.app",
    title: "BillingSaaS - Offline Billing Software for Indian Shops",
    description:
      "Offline-first billing for 30+ shop types. GST invoices, WhatsApp bills, works without internet.",
    siteName: "BillingSaaS",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillingSaaS - Offline Billing Software",
    description: "Offline-first billing for Indian shops",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BillingSaaS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="BillingSaaS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BillingSaaS" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}

"use client";

import React, { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { NetworkStatusIndicator } from "@/components/shared/network-status-indicator";
import { PwaInstallBanner } from "@/components/shared/pwa-install-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log("BillingSaaS PWA ServiceWorker active with scope:", registration.scope);
        })
        .catch((err) => {
          console.error("ServiceWorker registration error:", err);
        });
    }
  }, []);

  return (
    <SessionProvider>
      <NetworkStatusIndicator />
      <PwaInstallBanner />
      {children}
    </SessionProvider>
  );
}

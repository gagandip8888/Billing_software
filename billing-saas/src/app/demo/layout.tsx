import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clothing Shop Billing Demo | SS Solutions",
  description: "Sample clothing shop billing, dashboard, stock, and mobile screens.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

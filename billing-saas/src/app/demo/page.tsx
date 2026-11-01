import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Clothing Shop Billing Demo | SS Solutions",
  description: "Clothing shop billing software presentation demo.",
};

export default function DemoPage() {
  redirect("/demo/billing");
}

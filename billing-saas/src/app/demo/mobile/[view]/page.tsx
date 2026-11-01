import { redirect } from "next/navigation";
import { MobileShopDemo } from "@/components/demo/MobileShopDemo";

const views = ["stock", "udhari", "bills", "reports"] as const;

export default function DemoMobileViewPage({ params }: { params: { view: string } }) {
  if (!views.includes(params.view as (typeof views)[number])) {
    redirect("/demo/mobile");
  }

  return <MobileShopDemo view={params.view as (typeof views)[number]} />;
}

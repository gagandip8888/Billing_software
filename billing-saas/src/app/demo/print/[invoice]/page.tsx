import { notFound } from "next/navigation";
import { DemoPrint } from "@/components/demo/ClothingShopDemo";

export default function DemoInvoicePrintPage({ params }: { params: { invoice: string } }) {
  if (params.invoice !== "INV-1042") notFound();
  return <DemoPrint />;
}

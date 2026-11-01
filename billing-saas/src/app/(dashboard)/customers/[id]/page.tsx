import React from "react";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CustomerDetailClient } from "./CustomerDetailClient";

export const dynamic = "force-dynamic";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const tenant = await requireTenant();

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      tenantId: tenant.id,
    },
    include: {
      invoices: {
        orderBy: { invoiceDate: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const serializedCustomer = {
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    email: customer.email,
    address: customer.address,
    gstNo: customer.gstNo,
    totalSpent: Number(customer.totalSpent),
    creditBalance: Number(customer.creditBalance),
    totalInvoices: customer.totalInvoices || customer.totalBills || customer.invoices.length,
    firstVisitAt: customer.firstVisitAt.toISOString(),
    lastVisitAt: customer.lastVisitAt ? customer.lastVisitAt.toISOString() : null,
    invoices: customer.invoices.map((inv) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate.toISOString(),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      balanceAmount: Number(inv.balanceAmount),
      paymentMode: inv.paymentMode,
      status: inv.status,
    })),
  };

  return (
    <CustomerDetailClient
      customer={serializedCustomer}
      businessName={tenant.businessName}
    />
  );
}

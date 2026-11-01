import React, { Suspense } from "react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CustomersClient } from "@/components/customers/CustomersClient";

export const dynamic = "force-dynamic";

async function CustomersData() {
  const tenant = await requireTenant();

  const customers = await prisma.customer.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    orderBy: {
      lastVisitAt: "desc",
    },
  });

  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    firstVisitAt: c.firstVisitAt.toISOString(),
    lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
    totalInvoices: c.totalInvoices || c.totalBills || 0,
    totalSpent: Number(c.totalSpent),
    creditBalance: Number(c.creditBalance),
    address: c.address,
  }));

  return (
    <CustomersClient
      initialCustomers={serializedCustomers}
      businessName={tenant.businessName}
    />
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="h-24 bg-slate-200 rounded-xl" />
            <div className="h-24 bg-slate-200 rounded-xl" />
            <div className="h-24 bg-slate-200 rounded-xl" />
          </div>
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      }
    >
      <CustomersData />
    </Suspense>
  );
}

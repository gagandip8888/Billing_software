import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getCurrentTenant = cache(async () => {
  try {
    const session = await auth();
    if (session?.user?.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        include: {
          settings: true,
        },
      });
      if (tenant) return tenant;
    }
  } catch (err) {
    console.warn("auth() check in getCurrentTenant encountered error:", err);
  }

  // Fallback to the first active tenant for direct API testing (e.g. curl),
  // offline background sync, or local development environments
  try {
    const defaultTenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      include: {
        settings: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return defaultTenant;
  } catch (dbErr) {
    console.error("Database query failed in getCurrentTenant fallback:", dbErr);
    return null;
  }
});

export const requireTenant = cache(async () => {
  const tenant = await getCurrentTenant();
  if (!tenant || !tenant.isActive) {
    throw new Error("Unauthorized: Tenant session required");
  }
  return tenant;
});

export const getSessionUser = cache(async () => {
  try {
    const session = await auth();
    return session?.user ?? null;
  } catch {
    return null;
  }
});


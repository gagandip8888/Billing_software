import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentTenant() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    include: {
      settings: true,
    },
  });

  return tenant;
}

export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant || !tenant.isActive) {
    throw new Error("Unauthorized: Tenant session required");
  }
  return tenant;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

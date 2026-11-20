import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Verifies whether the provided password attempt matches:
 * 1. The tenant's configured delete/admin password in Setting table
 * 2. The store OWNER user's login password (hashed with bcrypt)
 * 3. The Tenant's master passwordHash
 */
export async function verifyOwnerPassword(
  tenantId: string,
  passwordAttempt: string
): Promise<boolean> {
  const cleanPassword = (passwordAttempt || "").trim();
  if (!cleanPassword) return false;

  try {
    // 1. Check custom delete password in Setting table if configured
    const setting = await prisma.setting.findUnique({
      where: { tenantId },
      select: { deletePassword: true },
    });
    if (setting?.deletePassword && setting.deletePassword.trim() === cleanPassword) {
      return true;
    }

    // 2. Check store OWNER user in User table
    const ownerUser = await prisma.user.findFirst({
      where: {
        tenantId,
        role: "OWNER",
        isActive: true,
      },
      select: { passwordHash: true },
    });

    if (ownerUser?.passwordHash) {
      const isOwnerMatch = await bcrypt.compare(cleanPassword, ownerUser.passwordHash);
      if (isOwnerMatch) return true;
    }

    // 3. Check Tenant record master password
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { passwordHash: true },
    });

    if (tenant?.passwordHash) {
      const isTenantMatch = await bcrypt.compare(cleanPassword, tenant.passwordHash);
      if (isTenantMatch) return true;
    }
  } catch (err) {
    console.error("Error verifying owner password:", err);
  }

  return false;
}

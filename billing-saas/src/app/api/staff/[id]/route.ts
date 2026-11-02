import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant, getSessionUser } from "@/lib/tenant";
import { Role } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE /api/staff/[id] - Remove an employee user
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const sessionUser = await getSessionUser();
    const { id } = params;

    // Security: Only shop OWNER can delete employee accounts
    if (sessionUser && sessionUser.role === Role.CASHIER) {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot manage or delete staff" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Protect OWNER account from being deleted
    if (targetUser.role === Role.OWNER) {
      return NextResponse.json(
        { error: "Cannot delete the Primary Store Owner account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: targetUser.id },
    });

    return NextResponse.json({
      success: true,
      message: `Employee "${targetUser.name}" removed successfully`,
    });
  } catch (error: any) {
    console.error(`DELETE /api/staff/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to remove staff member" },
      { status: 500 }
    );
  }
}


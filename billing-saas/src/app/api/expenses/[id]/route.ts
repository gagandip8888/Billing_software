import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant, getSessionUser } from "@/lib/tenant";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser && sessionUser.role === "CASHIER") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot delete expenses" },
        { status: 403 }
      );
    }

    const tenant = await requireTenant();
    const { id } = params;

    const expense = await prisma.expense.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/expenses/[id] error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}

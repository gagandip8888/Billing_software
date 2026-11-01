import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    const expenses = await prisma.expense.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    const serialized = expenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ expenses: serialized });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { title, amount, date } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Valid expense amount is required" },
        { status: 400 }
      );
    }

    const expenseDate = date ? new Date(date) : new Date();

    const expense = await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        title: title.trim(),
        amount: parsedAmount,
        date: expenseDate,
      },
    });

    return NextResponse.json(
      {
        expense: {
          id: expense.id,
          title: expense.title,
          amount: Number(expense.amount),
          date: expense.date.toISOString(),
          createdAt: expense.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

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
    console.error("DELETE /api/expenses error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}

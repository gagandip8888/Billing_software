import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { invoiceUpdateSchema } from "@/lib/validations/invoice";
import { serializeInvoice } from "@/lib/invoice-utils";
import { InvoiceStatus } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        customer: true,
        items: true,
        tenant: {
          select: {
            businessName: true,
            shopType: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            gstNo: true,
            mobile: true,
            email: true,
            settings: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice: serializeInvoice(invoice) });
  } catch (error: any) {
    console.error(`GET /api/invoices/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const existing = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = invoiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: any = {};

    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.dueDate !== undefined)
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.paymentMode !== undefined) updateData.paymentMode = data.paymentMode;

    if (data.paidAmount !== undefined) {
      const totalAmount = Number(existing.totalAmount);
      const newPaid = Math.max(0, Number(data.paidAmount));
      const balance = Math.max(0, Math.round((totalAmount - newPaid) * 100) / 100);

      updateData.paidAmount = newPaid;
      updateData.balanceAmount = balance;

      if (data.status) {
        updateData.status = data.status;
      } else if (newPaid >= totalAmount) {
        updateData.status = InvoiceStatus.PAID;
      } else if (newPaid > 0) {
        updateData.status = InvoiceStatus.PARTIAL;
      } else {
        updateData.status = InvoiceStatus.UNPAID;
      }
    } else if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === InvoiceStatus.PAID) {
        updateData.paidAmount = existing.totalAmount;
        updateData.balanceAmount = 0;
      }
    }

    if (data.metadata !== undefined) {
      updateData.metadata = {
        ...((existing.metadata as object) || {}),
        ...(data.metadata || {}),
      };
    }

    const updated = await prisma.invoice.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json({ invoice: serializeInvoice(updated) });
  } catch (error: any) {
    console.error(`PATCH /api/invoices/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get("permanent") === "true";

    const existing = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Role check: Only OWNER can permanently delete
    const session = await auth();
    const userRole = session?.user?.role;

    if (isPermanent) {
      if (userRole !== "OWNER") {
        return NextResponse.json(
          { error: "Forbidden: Only shop owners can permanently delete invoices" },
          { status: 403 }
        );
      }

      // Hard Delete in an atomic Prisma transaction
      await prisma.$transaction(async (tx) => {
        // a. Restore product stock (only if not already cancelled)
        if (existing.status !== InvoiceStatus.CANCELLED) {
          for (const item of existing.items) {
            if (item.productId) {
              try {
                await tx.product.update({
                  where: { id: item.productId, tenantId: tenant.id },
                  data: { stockQty: { increment: item.qty } },
                });
              } catch (e) {
                console.warn(`Could not restore stock for product ${item.productId}:`, e);
              }
            }
          }
        }

        // b. Recalculate customer statistics (if linked customer exists)
        if (existing.customerId) {
          try {
            const customer = await tx.customer.findUnique({
              where: { id: existing.customerId, tenantId: tenant.id },
            });

            if (customer) {
              const newTotalBills = Math.max(0, customer.totalBills - 1);
              const invoiceAmount = Number(existing.totalAmount);
              const currentSpent = Number(customer.totalSpent);
              const newTotalSpent = Math.max(0, currentSpent - invoiceAmount);

              await tx.customer.update({
                where: { id: customer.id },
                data: {
                  totalBills: newTotalBills,
                  totalSpent: newTotalSpent,
                },
              });
            }
          } catch (e) {
            console.warn(`Could not update customer stats for customer ${existing.customerId}:`, e);
          }
        }

        // c. Delete all invoice items explicitly
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: existing.id },
        });

        // d. Delete the invoice row
        await tx.invoice.delete({
          where: { id: existing.id },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Invoice ${existing.invoiceNo} permanently deleted`,
      });
    }

    // Default behavior: Soft cancel
    const cancelled = await prisma.$transaction(async (tx) => {
      // If invoice was active/paid, restore inventory
      if (existing.status !== InvoiceStatus.CANCELLED) {
        for (const item of existing.items) {
          if (item.productId) {
            try {
              await tx.product.update({
                where: { id: item.productId, tenantId: tenant.id },
                data: { stockQty: { increment: item.qty } },
              });
            } catch (e) {
              console.warn("Could not restore stock on invoice cancel:", e);
            }
          }
        }
      }

      return await tx.invoice.update({
        where: { id: existing.id },
        data: {
          status: InvoiceStatus.CANCELLED,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Invoice cancelled and inventory restored",
      invoice: serializeInvoice(cancelled),
    });
  } catch (error: any) {
    console.error(`DELETE /api/invoices/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to process invoice deletion" },
      { status: 500 }
    );
  }
}


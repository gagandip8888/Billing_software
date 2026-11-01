import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenant = await requireTenant();

    let setting = await prisma.setting.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          tenantId: tenant.id,
          invoicePrefix: "INV-",
          nextInvoiceNo: 1,
          language: "en",
        },
      });
    }

    return NextResponse.json({ setting });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const {
      upiId,
      preferredApp,
      bankName,
      bankAccount,
      bankIfsc,
      language,
      deletePassword,
      invoicePrefix,
      printFormat,
      termsConditions,
      gstEnabled,
      whatsappEnabled,
      whatsappNumber,
      // Optional tenant profile fields
      address,
      city,
      pincode,
      gstNo,
    } = body;

    // If profile fields are updated, update tenant
    if (address !== undefined || city !== undefined || pincode !== undefined || gstNo !== undefined) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          ...(address !== undefined && { address: address?.trim() || null }),
          ...(city !== undefined && { city: city?.trim() || null }),
          ...(pincode !== undefined && { pincode: pincode?.trim() || null }),
          ...(gstNo !== undefined && { gstNo: gstNo?.trim() || null }),
        },
      });
    }

    const setting = await prisma.setting.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        upiId: upiId !== undefined ? upiId?.trim() || null : null,
        preferredApp: preferredApp !== undefined ? preferredApp?.trim() || null : null,
        bankName: bankName !== undefined ? bankName?.trim() || null : null,
        bankAccount: bankAccount !== undefined ? bankAccount?.trim() || null : null,
        bankIfsc: bankIfsc !== undefined ? bankIfsc?.trim() || null : null,
        language: language || "en",
        deletePassword: deletePassword !== undefined ? deletePassword?.trim() || null : null,
        invoicePrefix: invoicePrefix || "INV-",
        printFormat: printFormat || "A4",
        termsConditions: termsConditions || null,
        gstEnabled: gstEnabled !== undefined ? Boolean(gstEnabled) : true,
        whatsappEnabled: whatsappEnabled !== undefined ? Boolean(whatsappEnabled) : false,
        whatsappNumber: whatsappNumber || null,
      },
      update: {
        ...(upiId !== undefined && { upiId: upiId?.trim() || null }),
        ...(preferredApp !== undefined && { preferredApp: preferredApp?.trim() || null }),
        ...(bankName !== undefined && { bankName: bankName?.trim() || null }),
        ...(bankAccount !== undefined && { bankAccount: bankAccount?.trim() || null }),
        ...(bankIfsc !== undefined && { bankIfsc: bankIfsc?.trim() || null }),
        ...(language !== undefined && { language }),
        ...(deletePassword !== undefined && { deletePassword: deletePassword?.trim() || null }),
        ...(invoicePrefix !== undefined && { invoicePrefix }),
        ...(printFormat !== undefined && { printFormat }),
        ...(termsConditions !== undefined && { termsConditions }),
        ...(gstEnabled !== undefined && { gstEnabled: Boolean(gstEnabled) }),
        ...(whatsappEnabled !== undefined && { whatsappEnabled: Boolean(whatsappEnabled) }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
      },
    });

    return NextResponse.json({
      success: true,
      setting,
      message: "Settings saved successfully",
    });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}


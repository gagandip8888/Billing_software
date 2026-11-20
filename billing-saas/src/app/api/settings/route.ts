import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant, getSessionUser } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenant = await requireTenant();
    const sessionUser = await getSessionUser();
    const isCashier = sessionUser?.role === "CASHIER";

    let setting = await prisma.setting.findUnique({
      where: { tenantId: tenant.id },
    });

    const defaultUpi = tenant.mobile
      ? `${tenant.mobile.replace(/\D/g, "").slice(-10)}@upi`
      : null;

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          tenantId: tenant.id,
          invoicePrefix: "INV-",
          nextInvoiceNo: 1,
          language: "en",
          upiId: defaultUpi,
        },
      });
    } else if (!setting.upiId && defaultUpi) {
      // Auto-link UPI ID if empty
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: { upiId: defaultUpi },
      });
    }

    // Hide sensitive deletePassword for Cashiers
    const sanitizedSetting = isCashier
      ? { ...setting, deletePassword: null }
      : setting;

    return NextResponse.json({
      setting: sanitizedSetting,
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName,
        shopType: tenant.shopType,
        ownerName: tenant.ownerName,
        mobile: tenant.mobile,
        address: tenant.address,
        city: tenant.city,
        pincode: tenant.pincode,
        gstNo: tenant.gstNo,
      },
    });
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
    const sessionUser = await getSessionUser();
    if (sessionUser && sessionUser.role === "CASHIER") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot modify settings" },
        { status: 403 }
      );
    }

    const tenant = await requireTenant();
    const body = await req.json();

    const {
      businessName,
      ownerName,
      mobile,
      shopType,
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
      address,
      city,
      pincode,
      gstNo,
    } = body;

    // Validate and update tenant shop profile details
    const tenantUpdateData: any = {};
    if (businessName !== undefined) {
      const cleanName = businessName.trim();
      if (!cleanName) {
        return NextResponse.json(
          { error: "Shop / Business Name cannot be empty" },
          { status: 400 }
        );
      }
      tenantUpdateData.businessName = cleanName;
    }

    if (ownerName !== undefined && ownerName.trim()) {
      tenantUpdateData.ownerName = ownerName.trim();
    }

    if (shopType !== undefined) {
      tenantUpdateData.shopType = shopType;
    }

    if (mobile !== undefined) {
      const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
      if (cleanMobile.length === 10 && cleanMobile !== tenant.mobile) {
        const existingTenant = await prisma.tenant.findUnique({
          where: { mobile: cleanMobile },
        });
        if (existingTenant && existingTenant.id !== tenant.id) {
          return NextResponse.json(
            { error: "This mobile number is already registered with another store" },
            { status: 400 }
          );
        }
        tenantUpdateData.mobile = cleanMobile;

        // Also update Owner User mobile for consistent login
        await prisma.user.updateMany({
          where: { tenantId: tenant.id, role: "OWNER" },
          data: { mobile: cleanMobile },
        });
      }
    }

    if (address !== undefined) tenantUpdateData.address = address?.trim() || null;
    if (city !== undefined) tenantUpdateData.city = city?.trim() || null;
    if (pincode !== undefined) tenantUpdateData.pincode = pincode?.trim() || null;
    if (gstNo !== undefined) tenantUpdateData.gstNo = gstNo?.trim() || null;

    let updatedTenant: any = tenant;
    if (Object.keys(tenantUpdateData).length > 0) {
      updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: tenantUpdateData,
        include: { settings: true },
      });
    }

    // Auto-fallback UPI ID if not set
    const effectiveUpi =
      upiId !== undefined
        ? upiId?.trim() || null
        : tenant.settings?.upiId || (updatedTenant.mobile ? `${updatedTenant.mobile.replace(/\D/g, "").slice(-10)}@upi` : null);

    const setting = await prisma.setting.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        upiId: effectiveUpi,
        preferredApp: preferredApp !== undefined ? preferredApp?.trim() || null : "PhonePe",
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

    // Invalidate full route and layout caches across the entire application so shop name and settings update instantly
    try {
      revalidatePath("/", "layout");
      revalidatePath("/billing/new");
      revalidatePath("/invoices");
      revalidatePath("/dashboard");
      revalidatePath("/settings");
    } catch (revalErr) {
      console.warn("revalidatePath error in settings:", revalErr);
    }

    return NextResponse.json({
      success: true,
      setting,
      tenant: updatedTenant,
      message: "Shop settings & profile updated successfully",
    });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}


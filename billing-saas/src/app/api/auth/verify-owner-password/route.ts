import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { verifyOwnerPassword } from "@/lib/owner-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password : "";

    if (!password.trim()) {
      return NextResponse.json(
        { error: "Owner password is required", valid: false },
        { status: 400 }
      );
    }

    const isValid = await verifyOwnerPassword(tenant.id, password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect Owner Password", valid: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: "Owner password verified successfully",
    });
  } catch (error: any) {
    console.error("POST /api/auth/verify-owner-password error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error", valid: false },
      { status: 500 }
    );
  }
}

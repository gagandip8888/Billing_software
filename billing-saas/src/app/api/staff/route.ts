import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireTenant, getSessionUser } from "@/lib/tenant";
import { Role } from "@prisma/client";

// GET /api/staff - List all staff users for current tenant
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const sessionUser = await getSessionUser();

    // Only OWNER can manage or view the full staff list
    if (sessionUser && sessionUser.role === Role.CASHIER) {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot view staff management" },
        { status: 403 }
      );
    }

    const staff = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error("GET /api/staff error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch staff members" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create a new Employee User with role = 'CASHIER'
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const sessionUser = await getSessionUser();

    // Security: Only OWNER can create employee accounts
    if (sessionUser && sessionUser.role === Role.CASHIER) {
      return NextResponse.json(
        { error: "Forbidden: Only shop owners can create employee accounts" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, mobile, email, password } = body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Employee name is required" },
        { status: 400 }
      );
    }

    if (!mobile || typeof mobile !== "string" || !mobile.trim()) {
      return NextResponse.json(
        { error: "Valid 10-digit mobile number is required" },
        { status: 400 }
      );
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    // Check if user with this mobile already exists in this tenant
    const existing = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        mobile: cleanMobile,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A staff member with mobile number ${cleanMobile} already exists.` },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // Create the User record with role = CASHIER
    const newEmployee = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        mobile: cleanMobile,
        email: email && typeof email === "string" && email.trim() ? email.trim() : null,
        passwordHash,
        role: Role.CASHIER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Employee "${newEmployee.name}" created successfully with CASHIER permissions.`,
      employee: newEmployee,
    });
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}


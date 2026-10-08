import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiRegisterSchema } from "@/lib/validations/auth";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = apiRegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      businessName,
      shopType,
      ownerName,
      mobile,
      email,
      password,
      address,
      gstNo,
    } = result.data;

    // Check if tenant with mobile or email already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ mobile }, { email }],
      },
    });

    if (existingTenant) {
      if (existingTenant.mobile === mobile) {
        return NextResponse.json(
          { error: "A shop with this mobile number already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "A shop with this email address already exists" },
        { status: 409 }
      );
    }

    // Check if user with mobile already exists
    const existingUser = await prisma.user.findFirst({
      where: { mobile },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this mobile number already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Tenant + Owner User + Settings in an atomic transaction
    const newTenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          businessName,
          shopType,
          ownerName,
          mobile,
          email,
          passwordHash,
          address: address || null,
          gstNo: gstNo || null,
          users: {
            create: {
              name: ownerName,
              mobile,
              email,
              passwordHash,
              role: Role.OWNER,
              isActive: true,
            },
          },
          settings: {
            create: {
              invoicePrefix: "INV-",
              nextInvoiceNo: 1,
              gstEnabled: true,
              printFormat: "A4",
            },
          },
        },
        select: {
          id: true,
          businessName: true,
          shopType: true,
          ownerName: true,
          mobile: true,
          email: true,
        },
      });

      return tenant;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shop registered successfully",
        tenant: newTenant,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating shop account" },
      { status: 500 }
    );
  }
}

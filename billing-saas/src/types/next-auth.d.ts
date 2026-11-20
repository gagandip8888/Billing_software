import { Role, ShopType } from "@prisma/client";
import { type DefaultSession } from "next-auth";
import { type JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    tenantId: string;
    role: Role;
    shopType: ShopType;
    businessName: string;
    mobile: string;
    employeeId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      userId: string;
      tenantId: string;
      role: Role;
      shopType: ShopType;
      businessName: string;
      mobile: string;
      employeeId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    tenantId: string;
    role: Role;
    shopType: ShopType;
    businessName: string;
    mobile: string;
    employeeId?: string | null;
  }
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { Role, ShopType } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "NsT/1PLm7dbw0OR+4okLqyIc2cUcZXxNvRiwBMyEoCw=",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { mobile, password } = parsed.data;

        // Find users matching mobile (handles owner or employee across tenants)
        const users = await prisma.user.findMany({
          where: {
            mobile: mobile.trim(),
            isActive: true,
          },
          include: {
            tenant: true,
          },
        });

        if (!users || users.length === 0) {
          return null;
        }

        let user: (typeof users)[0] | null = null;
        for (const candidate of users) {
          if (candidate.tenant && candidate.tenant.isActive) {
            const isValid = await bcrypt.compare(password, candidate.passwordHash);
            if (isValid) {
              user = candidate;
              break;
            }
          }
        }

        if (!user || !user.tenant) {
          return null;
        }

        // Update last login timestamp asynchronously
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } catch (e) {
          console.error("Failed to update lastLoginAt:", e);
        }

        return {
          id: user.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          tenantId: user.tenantId,
          shopType: user.tenant.shopType,
          businessName: user.tenant.businessName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.shopType = user.shopType;
        token.businessName = user.businessName;
        token.mobile = user.mobile;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.userId as string) ?? token.sub;
        session.user.userId = (token.userId as string) ?? token.sub;
        session.user.tenantId = token.tenantId as string;
        session.user.role = token.role as Role;
        session.user.shopType = token.shopType as ShopType;
        session.user.businessName = token.businessName as string;
        session.user.mobile = token.mobile as string;
      }
      return session;
    },
  },
});

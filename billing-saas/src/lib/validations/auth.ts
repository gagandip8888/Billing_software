import { z } from "zod";
import { ShopType } from "@prisma/client";

export const mobileRegex = /^[6-9]\d{9}$/;

export const registerSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, "Business name must be at least 2 characters")
      .max(100, "Business name too long"),
    shopType: z.nativeEnum(ShopType, {
      errorMap: () => ({ message: "Please select a valid shop type" }),
    }),
    ownerName: z
      .string()
      .trim()
      .min(2, "Owner name must be at least 2 characters")
      .max(100, "Owner name too long"),
    mobile: z
      .string()
      .trim()
      .regex(mobileRegex, "Enter a valid 10-digit Indian mobile number"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Please confirm your password"),
    address: z.string().trim().optional().or(z.literal("")),
    gstNo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5)"
      )
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const apiRegisterSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters"),
  shopType: z.nativeEnum(ShopType),
  ownerName: z
    .string()
    .trim()
    .min(2, "Owner name must be at least 2 characters"),
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, "Enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  address: z.string().trim().optional().nullable(),
  gstNo: z.string().trim().optional().nullable(),
});

export const loginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, "Enter a valid 10-digit Indian mobile number"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ApiRegisterInput = z.infer<typeof apiRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

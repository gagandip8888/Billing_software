import { z } from "zod";
import { PaymentMode, InvoiceStatus } from "@prisma/client";

export const invoiceItemSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  qty: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .positive("Quantity must be greater than 0"),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .min(0, "Price cannot be negative"),
  taxRate: z.coerce
    .number({ invalid_type_error: "Tax rate must be a number" })
    .min(0, "Tax rate cannot be negative")
    .max(28, "Max tax rate is 28%")
    .default(18),
  metadata: z.record(z.any()).optional().nullable(),
});

export const invoiceSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().max(100).optional().nullable(),
  customerMobile: z
    .string()
    .max(15)
    .optional()
    .nullable(),
  customerAddress: z.string().max(255).optional().nullable(),
  customerGstNo: z.string().max(15).optional().nullable(),
  paymentMode: z.nativeEnum(PaymentMode).default(PaymentMode.CASH),
  discountAmount: z.coerce
    .number({ invalid_type_error: "Discount must be a number" })
    .min(0, "Discount cannot be negative")
    .default(0),
  amountPaid: z.coerce
    .number({ invalid_type_error: "Amount paid must be a number" })
    .min(0, "Amount paid cannot be negative")
    .optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(500, "Notes too long").optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  items: z
    .array(invoiceItemSchema)
    .min(1, "Invoice must contain at least one item"),
});

export const invoiceUpdateSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  paymentMode: z.nativeEnum(PaymentMode).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

export const deleteInvoiceSchema = z.object({
  invoiceNo: z.string().min(1, "Invoice number is required to confirm deletion"),
});

export type DeleteInvoiceInput = z.infer<typeof deleteInvoiceSchema>;

import { z } from "zod";

const optionalCoercedNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
  z.number().min(0, "Value cannot be negative").optional()
);

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(150, "Product name is too long"),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  category: z.string().max(100, "Category is too long").optional().nullable(),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a valid number" })
    .positive("Price must be greater than 0"),
  costPrice: optionalCoercedNumber.nullable(),
  taxRate: z.coerce
    .number({ invalid_type_error: "Tax rate must be a valid number" })
    .min(0, "Tax rate cannot be negative")
    .max(28, "GST tax rate cannot exceed 28%")
    .default(18),
  hsnCode: z.string().max(20, "HSN code is too long").optional().nullable(),
  unit: z.string().default("pc"),
  stockQty: z.coerce
    .number({ invalid_type_error: "Stock is required" })
    .min(0, "Stock cannot be negative"),
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  mrp: optionalCoercedNumber.nullable(),
  variantGroupId: z.string().max(100).optional().nullable(),
  lowStockAlert: optionalCoercedNumber.nullable(),
  barcode: z.string().max(50, "Barcode is too long").optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

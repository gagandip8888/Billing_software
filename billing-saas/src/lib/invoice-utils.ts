import { InvoiceStatus } from "@prisma/client";

/**
 * Atomically generates and increments the next invoice number for a tenant
 */
export async function generateInvoiceNumber(
  tx: any,
  tenantId: string
): Promise<string> {
  let setting = await tx.setting.findUnique({
    where: { tenantId },
  });

  if (!setting) {
    setting = await tx.setting.create({
      data: {
        tenantId,
        invoicePrefix: "INV-",
        nextInvoiceNo: 1,
      },
    });
  }

  const prefix = setting.invoicePrefix || "INV-";
  const num = setting.nextInvoiceNo || 1;
  const formattedNumber = `${prefix}${String(num).padStart(4, "0")}`;

  // Increment atomically
  await tx.setting.update({
    where: { tenantId },
    data: {
      nextInvoiceNo: {
        increment: 1,
      },
    },
  });

  return formattedNumber;
}

export interface CalculatedItem {
  productId?: string | null;
  name: string;
  qty: number;
  price: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  metadata?: any;
}

export interface InvoiceTotalsResult {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  items: CalculatedItem[];
}

/**
 * Calculates item taxes, subtotal, discount, grand total, and payment status server-side
 */
export function calculateInvoiceTotals(
  items: Array<{
    productId?: string | null;
    name: string;
    qty: number;
    price: number;
    taxRate?: number;
    metadata?: any;
  }>,
  rawDiscount: number = 0,
  rawAmountPaid?: number
): InvoiceTotalsResult {
  let subtotal = 0;
  let taxAmount = 0;

  const calculatedItems: CalculatedItem[] = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const taxRate = Number(item.taxRate) || 0;

    const lineSubtotal = Math.round(qty * price * 100) / 100;
    const lineTax = Math.round(lineSubtotal * (taxRate / 100) * 100) / 100;
    const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

    subtotal += lineSubtotal;
    taxAmount += lineTax;

    return {
      productId: item.productId || null,
      name: item.name,
      qty,
      price,
      taxRate,
      taxAmount: lineTax,
      total: lineTotal,
      metadata: item.metadata || {},
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  taxAmount = Math.round(taxAmount * 100) / 100;

  // Discount cannot exceed subtotal + tax
  const maxAllowedDiscount = Math.round((subtotal + taxAmount) * 100) / 100;
  const discountAmount = Math.min(
    Math.max(0, Number(rawDiscount) || 0),
    maxAllowedDiscount
  );

  const totalAmount = Math.max(
    0,
    Math.round((subtotal + taxAmount - discountAmount) * 100) / 100
  );

  // If amountPaid is not provided, default to full payment (PAID)
  const paidAmount =
    rawAmountPaid !== undefined && rawAmountPaid !== null
      ? Math.max(0, Math.round(Number(rawAmountPaid) * 100) / 100)
      : totalAmount;

  const balanceAmount = Math.max(
    0,
    Math.round((totalAmount - paidAmount) * 100) / 100
  );

  let status: InvoiceStatus = InvoiceStatus.PAID;
  if (paidAmount >= totalAmount) {
    status = InvoiceStatus.PAID;
  } else if (paidAmount > 0) {
    status = InvoiceStatus.PARTIAL;
  } else {
    status = InvoiceStatus.UNPAID;
  }

  return {
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    paidAmount,
    balanceAmount,
    status,
    items: calculatedItems,
  };
}

/**
 * Serializes Prisma Decimal and Date objects into standard JSON primitives
 */
export function serializeInvoice(invoice: any) {
  if (!invoice) return invoice;

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    discountAmount: Number(invoice.discountAmount || 0),
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount || 0),
    balanceAmount: Number(invoice.balanceAmount || 0),
    invoiceDate:
      invoice.invoiceDate instanceof Date
        ? invoice.invoiceDate.toISOString()
        : invoice.invoiceDate,
    dueDate:
      invoice.dueDate instanceof Date
        ? invoice.dueDate.toISOString()
        : invoice.dueDate,
    createdAt:
      invoice.createdAt instanceof Date
        ? invoice.createdAt.toISOString()
        : invoice.createdAt,
    updatedAt:
      invoice.updatedAt instanceof Date
        ? invoice.updatedAt.toISOString()
        : invoice.updatedAt,
    items: invoice.items
      ? invoice.items.map((item: any) => ({
          ...item,
          qty: Number(item.qty),
          price: Number(item.price),
          taxRate: Number(item.taxRate),
          taxAmount: Number(item.taxAmount),
          total: Number(item.total),
        }))
      : [],
    customer: invoice.customer
      ? {
          ...invoice.customer,
          totalSpent: Number(invoice.customer.totalSpent || 0),
        }
      : null,
  };
}

/**
 * Converts numeric amounts into Indian English words (e.g. 1250 -> "One Thousand Two Hundred Fifty Rupees Only")
 */
export function numberToWordsIndian(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Zero Rupees Only";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function numToWords(n: number): string {
    if (n === 0) return "";
    let str = "";
    if (n >= 10000000) {
      str += numToWords(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += numToWords(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += numToWords(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n >= 100) {
      str += numToWords(Math.floor(n / 100)) + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
      }
    }
    return str;
  }

  const intPart = Math.floor(amount);
  const paisePart = Math.round((amount - intPart) * 100);

  let words = numToWords(intPart).trim() + " Rupees";
  if (paisePart > 0) {
    words += " and " + numToWords(paisePart).trim() + " Paise";
  }
  return words + " Only";
}

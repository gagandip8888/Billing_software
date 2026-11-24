import { jsPDF } from "jspdf";
import { numberToWordsIndian } from "@/lib/invoice-utils";

export interface InvoicePdfData {
  id?: string;
  invoiceNo: string;
  invoiceDate?: string | Date;
  shopName: string;
  shopAddress?: string | null;
  shopCity?: string | null;
  shopState?: string | null;
  shopPincode?: string | null;
  shopMobile?: string | null;
  shopGst?: string | null;
  customerName?: string | null;
  customerMobile?: string | null;
  customerAddress?: string | null;
  customerGst?: string | null;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    taxRate?: number;
    taxAmount?: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentMode?: string;
  termsConditions?: string | null;
}

/**
 * Generates a clean, professional A4 Tax Invoice PDF in the browser using jsPDF
 */
export function generateInvoicePDF(data: InvoicePdfData): {
  doc: jsPDF;
  blob: Blob;
  file: File;
  download: () => void;
} {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryColor = [30, 41, 59]; // slate-800
  const secondaryColor = [71, 85, 105]; // slate-600
  const accentColor = [79, 70, 229]; // indigo-600
  const lightBg = [248, 250, 252]; // slate-50
  const borderColor = [226, 232, 240]; // slate-200

  // 1. HEADER (Shop Info on Left, Invoice Details on Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(data.shopName || "Retail Store", margin, y + 4);

  // Shop Address & Contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  const addressParts = [
    data.shopAddress,
    data.shopCity,
    data.shopState ? `${data.shopState} ${data.shopPincode || ""}` : data.shopPincode,
  ].filter(Boolean);
  
  let headerY = y + 9;
  if (addressParts.length > 0) {
    doc.text(addressParts.join(", "), margin, headerY);
    headerY += 4;
  }
  
  const contactParts: string[] = [];
  if (data.shopMobile) contactParts.push(`Phone: ${data.shopMobile}`);
  if (data.shopGst) contactParts.push(`GSTIN: ${data.shopGst}`);
  if (contactParts.length > 0) {
    doc.text(contactParts.join("  |  "), margin, headerY);
  }

  // Right side: Tax Invoice Badge & Invoice Meta
  const rightX = pageWidth - margin;
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(rightX - 32, y, 32, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("TAX INVOICE", rightX - 16, y + 4.2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`#${data.invoiceNo}`, rightX, y + 11, { align: "right" });

  const invDate = new Date(data.invoiceDate || Date.now());
  const dateStr = invDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Date: ${dateStr}`, rightX, y + 16, { align: "right" });
  doc.text(`Payment: ${(data.paymentMode || "CASH").toUpperCase()}`, rightX, y + 20, { align: "right" });

  y += 26;

  // Divider line
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, rightX, y);
  y += 4;

  // 2. BILLED TO & STATUS BOX
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

  // Left: Customer details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("BILLED TO (CUSTOMER):", margin + 3.5, y + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(data.customerName || "Cash Customer", margin + 3.5, y + 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const custContact = [
    data.customerMobile ? `Phone: ${data.customerMobile}` : null,
    data.customerGst ? `GSTIN: ${data.customerGst}` : null,
  ].filter(Boolean).join("  |  ");
  if (custContact) {
    doc.text(custContact, margin + 3.5, y + 14);
  }
  if (data.customerAddress) {
    doc.text(data.customerAddress.slice(0, 50), margin + 3.5, y + 18);
  }

  // Right: Status
  const isPaid = (data.balanceAmount ?? 0) <= 0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  if (isPaid) {
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text("STATUS: PAID", rightX - 4, y + 8, { align: "right" });
  } else {
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(`BALANCE DUE: Rs. ${Number(data.balanceAmount).toFixed(2)}`, rightX - 4, y + 8, { align: "right" });
  }

  y += 24;

  // 3. ITEMS TABLE
  const colX = {
    num: margin + 2,
    desc: margin + 12,
    qty: margin + 98,
    rate: margin + 124,
    tax: margin + 148,
    total: rightX - 2,
  };

  // Table Header
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, y + 7, rightX, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("#", colX.num, y + 4.8);
  doc.text("ITEM DESCRIPTION", colX.desc, y + 4.8);
  doc.text("QTY", colX.qty, y + 4.8, { align: "center" });
  doc.text("RATE (Rs.)", colX.rate, y + 4.8, { align: "right" });
  doc.text("GST %", colX.tax, y + 4.8, { align: "center" });
  doc.text("AMOUNT (Rs.)", colX.total, y + 4.8, { align: "right" });

  y += 8;

  // Table Body Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const items = data.items && data.items.length > 0 ? data.items : [];
  items.forEach((item, idx) => {
    // Check if new page needed
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(String(idx + 1), colX.num, y + 4);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    const itemName = item.name.length > 40 ? item.name.slice(0, 38) + "..." : item.name;
    doc.text(itemName, colX.desc, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(String(item.qty), colX.qty, y + 4, { align: "center" });
    doc.text(Number(item.price).toFixed(2), colX.rate, y + 4, { align: "right" });
    doc.text(item.taxRate ? `${item.taxRate}%` : "0%", colX.tax, y + 4, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(Number(item.total).toFixed(2), colX.total, y + 4, { align: "right" });

    y += 6.5;
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, y, rightX, y);
    y += 1.5;
  });

  y += 3;

  // 4. TOTALS SUMMARY BOX (Right aligned)
  const totalsBoxWidth = 72;
  const totalsBoxX = rightX - totalsBoxWidth;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  doc.text("Subtotal:", totalsBoxX, y + 4);
  doc.text(`Rs. ${Number(data.subtotal).toFixed(2)}`, rightX, y + 4, { align: "right" });
  y += 5;

  if (Number(data.discountAmount) > 0) {
    doc.setTextColor(5, 150, 105);
    doc.text("Discount:", totalsBoxX, y + 4);
    doc.text(`- Rs. ${Number(data.discountAmount).toFixed(2)}`, rightX, y + 4, { align: "right" });
    y += 5;
  }

  if (Number(data.taxAmount) > 0) {
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("GST (Tax):", totalsBoxX, y + 4);
    doc.text(`Rs. ${Number(data.taxAmount).toFixed(2)}`, rightX, y + 4, { align: "right" });
    y += 5;
  }

  // Grand Total Highlight Bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(totalsBoxX - 2, y + 1, totalsBoxWidth + 2, 7.5, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL:", totalsBoxX + 2, y + 6);
  doc.text(`Rs. ${Number(data.totalAmount).toFixed(2)}`, rightX - 1, y + 6, { align: "right" });

  y += 12;

  // Amount in words
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Amount in Words: ${numberToWordsIndian(Number(data.totalAmount))}`, margin, y);

  y += 12;

  // 5. FOOTER & TERMS
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  const terms = data.termsConditions || "Goods once sold are subject to store policy. Computer-generated tax invoice.";
  doc.text(`Terms: ${terms}`, margin, y);
  doc.text("Authorized Signatory", rightX, y, { align: "right" });

  // Generate output files
  const blob = doc.output("blob");
  const fileName = `Invoice-${data.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  const file = new File([blob], fileName, { type: "application/pdf" });

  const download = () => {
    doc.save(fileName);
  };

  return { doc, blob, file, download };
}

/**
 * Shares invoice PDF directly to WhatsApp:
 * 1. Uses navigator.share with the actual PDF File on devices supporting Web Share API (Mobile Android & iOS).
 *    WhatsApp receives the actual .pdf file attached directly in the chat!
 * 2. Fallback on desktop browsers: downloads the PDF file to disk, and opens WhatsApp chat with pre-filled message (NO website link!).
 */
export async function shareInvoicePdfDirect(
  invoice: InvoicePdfData,
  options?: {
    onSuccess?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  const { file, download } = generateInvoicePDF(invoice);

  const cleanMobile = (invoice.customerMobile || "").replace(/\D/g, "");
  const mobile10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : "";
  const customerName = invoice.customerName?.trim() || "Customer";

  // Clean WhatsApp text (NO website link!)
  const whatsappText = `Hi ${customerName}, here is your bill #${invoice.invoiceNo} for Rs. ${Number(
    invoice.totalAmount
  ).toFixed(2)} from ${invoice.shopName}. Please find the PDF invoice file attached.\n\nThank you for your business!`;

  // 1. Try native Web Share API with attached File (works on Mobile Chrome, Safari, Android, iOS)
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `Bill #${invoice.invoiceNo}`,
        text: whatsappText,
      });
      options?.onSuccess?.();
      return;
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled share dialog, ignore
        return;
      }
      console.warn("navigator.share failed, using fallback:", err);
    }
  }

  // 2. Fallback for Desktop WhatsApp Web or browsers without file share:
  // Download the PDF file directly to device
  download();

  // Open WhatsApp chat directly with clean message (NO website link)
  const waUrl = mobile10
    ? `https://wa.me/91${mobile10}?text=${encodeURIComponent(whatsappText)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  options?.onSuccess?.();
}

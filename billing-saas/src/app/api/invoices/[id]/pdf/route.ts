import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { numberToWordsIndian } from "@/lib/invoice-utils";
import { SHOP_TEMPLATES } from "@/lib/shop-templates";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        customer: true,
        items: true,
        tenant: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || invoice.tenant.settings?.printFormat || "A4";

    const customerName =
      invoice.customer?.name ||
      (invoice.metadata as any)?.walkInCustomerName ||
      "Cash Customer";
    const customerMobile =
      invoice.customer?.mobile ||
      (invoice.metadata as any)?.walkInCustomerMobile ||
      "";
    const customerAddress = invoice.customer?.address || "";
    const customerGst = invoice.customer?.gstNo || "";

    const dateStr = new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const template = SHOP_TEMPLATES[invoice.tenant.shopType] || SHOP_TEMPLATES.CUSTOM;
    const metadata = (invoice.metadata as Record<string, any>) || {};

    // Dynamic metadata entries to display
    const metaEntries = Object.entries(metadata).filter(
      ([key, val]) =>
        !key.startsWith("walkIn") && val !== undefined && val !== null && val !== ""
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #f8fafc; color: #0f172a; padding: 24px; font-size: 13px; line-height: 1.4; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
    .business-title { font-size: 22px; font-weight: 800; color: #1e293b; }
    .shop-type-badge { display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }
    .business-contact { font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.5; }
    .invoice-meta { text-align: right; }
    .tax-badge { font-size: 12px; font-weight: 700; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
    .invoice-no { font-size: 18px; font-weight: 800; font-family: monospace; color: #0f172a; }
    .client-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .meta-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .meta-tag { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-size: 11px; }
    .meta-tag strong { color: #334155; text-transform: capitalize; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .text-right { text-align: right; }
    .totals-grid { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-table { width: 280px; }
    .totals-table td { padding: 6px 0; border: none; font-size: 12px; }
    .totals-table tr.grand-total td { border-top: 2px solid #0f172a; font-size: 15px; font-weight: 800; color: #0f172a; padding-top: 8px; }
    .words-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #475569; margin-bottom: 20px; }
    .footer { display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; font-size: 11px; color: #64748b; }
    .sign-box { text-align: center; width: 180px; }
    .sign-line { border-top: 1px dashed #94a3b8; margin-top: 40px; padding-top: 4px; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center;">
    <a href="/invoices/${invoice.id}" style="color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 600;">&larr; Back to Invoice</a>
    <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print Invoice</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="business-title">${tenant.businessName}</div>
        <div class="shop-type-badge">${template.name}</div>
        <div class="business-contact">
          ${tenant.address ? `${tenant.address}, ` : ""}${tenant.city ? `${tenant.city}, ` : ""}${tenant.state || ""}<br>
          ${tenant.gstNo ? `<strong>GSTIN:</strong> ${tenant.gstNo} &bull; ` : ""}
          <strong>Phone:</strong> ${tenant.mobile || ""}
        </div>
      </div>
      <div class="invoice-meta">
        <div class="tax-badge">TAX INVOICE</div>
        <div class="invoice-no">${invoice.invoiceNo}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: <strong>${dateStr}</strong></div>
        <div style="font-size: 11px; color: #64748b;">Payment Mode: <strong style="text-transform: uppercase;">${invoice.paymentMode}</strong></div>
      </div>
    </div>

    <div class="client-details">
      <div>
        <div class="section-label">Billed To</div>
        <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${customerName}</div>
        ${customerMobile ? `<div style="color: #475569; font-size: 11px;">Phone: ${customerMobile}</div>` : ""}
        ${customerAddress ? `<div style="color: #475569; font-size: 11px;">${customerAddress}</div>` : ""}
        ${customerGst ? `<div style="color: #475569; font-size: 11px;">GSTIN: ${customerGst}</div>` : ""}
      </div>
      <div>
        <div class="section-label">Invoice Details</div>
        <div style="font-size: 11px; color: #475569;">Status: <strong style="color: ${invoice.status === 'PAID' ? '#059669' : '#dc2626'};">${invoice.status}</strong></div>
        <div style="font-size: 11px; color: #475569;">Balance Due: <strong>₹${Number(invoice.balanceAmount).toFixed(2)}</strong></div>
      </div>
    </div>

    ${metaEntries.length > 0 ? `
    <div class="meta-tags">
      ${metaEntries.map(([k, v]) => `
        <div class="meta-tag"><strong>${k.replace(/([A-Z])/g, ' $1')}:</strong> ${String(v)}</div>
      `).join("")}
    </div>` : ""}

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Item / Service</th>
          <th class="text-right" style="width: 70px;">Qty</th>
          <th class="text-right" style="width: 100px;">Rate (₹)</th>
          <th class="text-right" style="width: 70px;">GST</th>
          <th class="text-right" style="width: 110px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${item.name}</strong>
          </td>
          <td class="text-right">${Number(item.qty)}</td>
          <td class="text-right">₹${Number(item.price).toFixed(2)}</td>
          <td class="text-right">${Number(item.taxRate)}%</td>
          <td class="text-right"><strong>₹${Number(item.total).toFixed(2)}</strong></td>
        </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="totals-grid">
      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Subtotal:</td>
          <td class="text-right">₹${Number(invoice.subtotal).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Tax Amount (GST):</td>
          <td class="text-right">₹${Number(invoice.taxAmount).toFixed(2)}</td>
        </tr>
        ${Number(invoice.discountAmount) > 0 ? `
        <tr>
          <td style="color: #059669;">Discount:</td>
          <td class="text-right" style="color: #059669;">- ₹${Number(invoice.discountAmount).toFixed(2)}</td>
        </tr>
        ` : ""}
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td class="text-right">₹${Number(invoice.totalAmount).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Paid Amount:</td>
          <td class="text-right" style="color: #059669; font-weight: 600;">₹${Number(invoice.paidAmount).toFixed(2)}</td>
        </tr>
        ${Number(invoice.balanceAmount) > 0 ? `
        <tr>
          <td style="color: #dc2626; font-weight: 600;">Balance Due:</td>
          <td class="text-right" style="color: #dc2626; font-weight: 700;">₹${Number(invoice.balanceAmount).toFixed(2)}</td>
        </tr>
        ` : ""}
      </table>
    </div>

    <div class="words-box">
      <strong>Amount in Words:</strong> ${numberToWordsIndian(Number(invoice.totalAmount))}
    </div>

    ${invoice.notes ? `
    <div style="font-size: 11px; color: #475569; margin-bottom: 20px;">
      <strong>Notes:</strong> ${invoice.notes}
    </div>` : ""}

    <div class="footer">
      <div>
        <strong>Terms & Conditions:</strong><br>
        ${tenant.settings?.termsConditions || "1. Goods once sold will not be taken back without valid bill.<br>2. Subject to local jurisdiction."}
      </div>
      <div class="sign-box">
        <div class="sign-line">For ${tenant.businessName}<br>(Authorised Signatory)</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("GET /api/invoices/[id]/pdf error:", error);
    return new NextResponse("Failed to render invoice print preview", {
      status: 500,
    });
  }
}

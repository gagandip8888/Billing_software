"use client";

import React, { useState } from "react";
import { Store, Receipt, Printer, FileText } from "lucide-react";
import { numberToWordsIndian } from "@/lib/invoice-utils";
import { SHOP_TEMPLATES } from "@/lib/shop-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InvoicePrintProps {
  invoice: any;
  tenant: any;
}

export function InvoicePrint({ invoice, tenant }: InvoicePrintProps) {
  const [printFormat, setPrintFormat] = useState<"A4" | "THERMAL">("A4");

  const template = SHOP_TEMPLATES[tenant?.shopType] || SHOP_TEMPLATES.CUSTOM;
  const metadata = (invoice.metadata as Record<string, any>) || {};

  const customerName =
    invoice.customer?.name ||
    metadata.walkInCustomerName ||
    "Cash / Walk-in Customer";
  const customerMobile =
    invoice.customer?.mobile || metadata.walkInCustomerMobile || "";
  const customerAddress = invoice.customer?.address || "";
  const customerGst = invoice.customer?.gstNo || "";

  const dateFormatted = new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeFormatted = new Date(invoice.invoiceDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Filter dynamic shop metadata keys
  const shopMetaEntries = Object.entries(metadata).filter(
    ([key, val]) =>
      !key.startsWith("walkIn") &&
      val !== undefined &&
      val !== null &&
      val !== ""
  );

  return (
    <div className="space-y-4">
      {/* Format Toggle Bar (Hidden on print) */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Print Preview Layout:</span>
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setPrintFormat("A4")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                printFormat === "A4"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="inline-block h-3.5 w-3.5 mr-1" /> A4 Standard
            </button>
            <button
              onClick={() => setPrintFormat("THERMAL")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                printFormat === "THERMAL"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="inline-block h-3.5 w-3.5 mr-1" /> 80mm Thermal POS
            </button>
          </div>
        </div>

        <Button
          onClick={() => window.print()}
          size="sm"
          className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
        >
          <Printer className="h-3.5 w-3.5" /> Print Now
        </Button>
      </div>

      {/* ===================== A4 FORMAT ===================== */}
      {printFormat === "A4" && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-blue-600 pb-5 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm print:border print:border-blue-600">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {tenant?.businessName}
                  </h1>
                  <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                    {template.name}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-1 leading-relaxed max-w-md">
                {tenant?.address && <span>{tenant.address}, </span>}
                {tenant?.city && <span>{tenant.city}, </span>}
                {tenant?.state && <span>{tenant.state} </span>}
                {tenant?.pincode && <span>- {tenant.pincode}</span>}
                <div className="pt-0.5">
                  {tenant?.gstNo && (
                    <span className="mr-3 font-semibold text-slate-700">
                      GSTIN: {tenant.gstNo}
                    </span>
                  )}
                  {tenant?.mobile && (
                    <span className="text-slate-700">Ph: {tenant.mobile}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                Tax Invoice
              </div>
              <div className="text-xl font-mono font-black text-slate-900 pt-1">
                {invoice.invoiceNo}
              </div>
              <div className="text-xs text-slate-500">
                Date: <strong className="text-slate-800">{dateFormatted}</strong>
              </div>
              <div className="text-xs text-slate-500">
                Payment: <strong className="text-slate-800 uppercase">{invoice.paymentMode}</strong>
              </div>
            </div>
          </div>

          {/* Billed To & Dynamic Shop Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 border border-slate-200/80 rounded-lg p-4 mb-6 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Customer Details
              </div>
              <div className="text-sm font-bold text-slate-900">{customerName}</div>
              {customerMobile && (
                <div className="text-slate-600 mt-0.5">Mobile: {customerMobile}</div>
              )}
              {customerAddress && (
                <div className="text-slate-600 mt-0.5">{customerAddress}</div>
              )}
              {customerGst && (
                <div className="text-slate-600 font-mono mt-0.5">GSTIN: {customerGst}</div>
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Billing & Shop Attributes
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Status:</span>
                  <span
                    className={`font-bold ${
                      invoice.status === "PAID"
                        ? "text-emerald-700"
                        : invoice.status === "PARTIAL"
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                {shopMetaEntries.map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 capitalize">
                      {k.replace(/([A-Z])/g, " $1")}:
                    </span>
                    <span className="font-semibold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Item / Service Description</th>
                  <th className="py-2.5 px-3 text-right w-20">Qty</th>
                  <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-20">GST %</th>
                  <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoice.items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.name}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {Object.entries(item.metadata)
                            .map(([mk, mv]) => `${mk}: ${mv}`)
                            .join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">{item.qty}</td>
                    <td className="py-2.5 px-3 text-right">₹{Number(item.price).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">{Number(item.taxRate)}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{Number(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
            <div className="space-y-3 flex-1">
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider mb-1">
                  Amount in Words
                </span>
                <span className="font-bold text-slate-800">
                  {numberToWordsIndian(Number(invoice.totalAmount))}
                </span>
              </div>

              {invoice.notes && (
                <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 rounded-lg p-2.5">
                  <strong className="text-slate-800">Notes:</strong> {invoice.notes}
                </div>
              )}
            </div>

            <div className="w-full sm:w-72 bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST Tax:</span>
                <span>₹{Number(invoice.taxAmount).toFixed(2)}</span>
              </div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>- ₹{Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span>₹{Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                <span>Amount Paid:</span>
                <span>₹{Number(invoice.paidAmount).toFixed(2)}</span>
              </div>
              {Number(invoice.balanceAmount) > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Balance Due:</span>
                  <span>₹{Number(invoice.balanceAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Terms & Sign */}
          <div className="border-t border-slate-200 pt-5 mt-6 flex justify-between items-end text-xs text-slate-500">
            <div className="max-w-md space-y-1">
              <div className="font-bold text-slate-700 text-[11px]">Terms & Conditions:</div>
              <div className="text-[10px] leading-relaxed">
                {tenant?.settings?.termsConditions ||
                  "1. Goods once sold will not be returned without original receipt. 2. Subject to local jurisdiction."}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold pt-1">
                Thank you for your business! Visit Again.
              </div>
            </div>

            <div className="text-center w-48">
              <div className="border-b border-dashed border-slate-400 pb-1 mb-1 font-semibold text-slate-800 text-[11px]">
                For {tenant?.businessName}
              </div>
              <div className="text-[10px] text-slate-400">Authorised Signatory</div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 80MM THERMAL RECEIPT FORMAT ===================== */}
      {printFormat === "THERMAL" && (
        <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-sm w-[300px] mx-auto text-[11px] font-mono leading-tight print:w-[80mm] print:border-none print:shadow-none print:p-1 print:m-0">
          <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
            <div className="font-bold text-sm tracking-tight text-slate-900 uppercase">
              {tenant?.businessName}
            </div>
            <div className="text-[10px] text-slate-600">
              {tenant?.address || ""}, {tenant?.city || ""}
            </div>
            {tenant?.mobile && (
              <div className="text-[10px] text-slate-600">Tel: {tenant.mobile}</div>
            )}
            {tenant?.gstNo && (
              <div className="text-[10px] font-bold text-slate-800">
                GSTIN: {tenant.gstNo}
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px]">
            <div className="flex justify-between">
              <span>Bill: <strong>{invoice.invoiceNo}</strong></span>
              <span>{dateFormatted}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cust: {customerName.slice(0, 16)}</span>
              <span>{timeFormatted}</span>
            </div>
            {shopMetaEntries.slice(0, 2).map(([k, v]) => (
              <div key={k} className="flex justify-between text-slate-600">
                <span className="capitalize">{k}:</span>
                <span className="font-semibold">{String(v).slice(0, 15)}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-1 text-[10px]">
              <span>ITEM</span>
              <span className="text-right">QTY x RATE = AMT</span>
            </div>
            {invoice.items.map((item: any, i: number) => (
              <div key={i} className="py-0.5">
                <div className="font-semibold truncate">{item.name}</div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>
                    {Number(item.qty)} x ₹{Number(item.price).toFixed(2)}
                  </span>
                  <span className="font-bold text-slate-900">
                    ₹{Number(item.total).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-400 mb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (GST):</span>
              <span>₹{Number(invoice.taxAmount).toFixed(2)}</span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-₹{Number(invoice.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
              <span>NET TOTAL:</span>
              <span>₹{Number(invoice.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Paid ({invoice.paymentMode}):</span>
              <span>₹{Number(invoice.paidAmount).toFixed(2)}</span>
            </div>
            {Number(invoice.balanceAmount) > 0 && (
              <div className="flex justify-between font-bold text-red-600 text-[10px]">
                <span>BALANCE:</span>
                <span>₹{Number(invoice.balanceAmount).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-500 pt-1">
            *** Thank you! Visit Again ***
          </div>
        </div>
      )}
    </div>
  );
}

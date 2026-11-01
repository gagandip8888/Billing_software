"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReturnDialog } from "@/components/invoices/ReturnDialog";
import { useRouter } from "next/navigation";

interface InvoiceReturnActionProps {
  invoice: {
    id: string;
    invoiceNo: string;
    items: Array<{
      id: string;
      productId?: string | null;
      name: string;
      qty: number;
      price: number;
      total: number;
      size?: string | null;
      color?: string | null;
    }>;
  };
}

export function InvoiceReturnAction({ invoice }: InvoiceReturnActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-9 text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Return / Exchange
      </Button>

      <ReturnDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        invoice={invoice}
        onReturnSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}

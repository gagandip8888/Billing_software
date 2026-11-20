"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  IndianRupee,
  RotateCcw,
  Users,
  Menu,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface MobileBottomNavProps {
  userRole?: string;
  onOpenMenu?: () => void;
}

export function MobileBottomNav({ userRole, onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const effectiveRole = userRole || (session?.user as any)?.role || "OWNER";
  const isCashier = effectiveRole === "CASHIER";

  const ownerItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Billing", href: "/billing/new", icon: PlusCircle, isPrimary: true },
    { label: "Invoices", href: "/invoices", icon: FileSpreadsheet },
    { label: "Udhari", href: "/udhari", icon: IndianRupee },
  ];

  const cashierItems = [
    { label: "Billing", href: "/billing/new", icon: PlusCircle, isPrimary: true },
    { label: "Invoices", href: "/invoices", icon: FileSpreadsheet },
    { label: "Udhari", href: "/udhari", icon: IndianRupee },
    { label: "Returns", href: "/returns", icon: RotateCcw },
    { label: "Customers", href: "/customers", icon: Users },
  ];

  const items = isCashier ? cashierItems : ownerItems;

  const isActive = (href: string) => {
    if (href === "/billing/new") return pathname?.startsWith("/billing");
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around select-none shadow-2xl safe-area-bottom"
      aria-label="Mobile Bottom Navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        if (item.isPrimary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="flex flex-col items-center justify-center -mt-4 group relative"
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  active
                    ? "bg-[#7C3AED] text-white ring-4 ring-slate-900 shadow-purple-900/50"
                    : "bg-[#7C3AED] text-white hover:bg-purple-600 shadow-purple-900/30"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span
                className={`text-[10px] font-bold mt-1 tracking-tight ${
                  active ? "text-purple-300" : "text-slate-300"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors active:scale-95 ${
              active
                ? "text-purple-400 font-bold"
                : "text-slate-400 hover:text-slate-200 font-medium"
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? "text-purple-400" : "text-slate-400"}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}

      {!isCashier && (
        <button
          type="button"
          onClick={() => {
            if (onOpenMenu) {
              onOpenMenu();
            } else if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("billingsaas:open-mobile-menu"));
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors active:scale-95"
          aria-label="More Navigation Options"
        >
          <Menu className="h-5 w-5 text-slate-400" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">More</span>
        </button>
      )}
    </nav>
  );
}

export default MobileBottomNav;

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
  Receipt,
  Package,
  Users,
  Settings,
  LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useSession } from "next-auth/react";

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "red" | "amber" | "purple";
}

interface SidebarNavProps {
  udhariTotal?: number;
  onNavigate?: () => void;
  userRole?: string;
}

export function SidebarNav({ udhariTotal = 0, onNavigate, userRole }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const effectiveRole = userRole || (session?.user as any)?.role || "OWNER";
  const isCashier = effectiveRole === "CASHIER";

  const navItems: NavItemConfig[] = [
    {
      label: t("dashboard", "Dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("billing", "Billing"),
      href: "/billing/new",
      icon: PlusCircle,
    },
    {
      label: t("invoices", "Invoices"),
      href: "/invoices",
      icon: FileSpreadsheet,
    },
    {
      label: t("udhari", "Udhari"),
      href: "/udhari",
      icon: IndianRupee,
      badge: udhariTotal > 0 ? `₹${Math.round(udhariTotal).toLocaleString("en-IN")}` : undefined,
      badgeVariant: "red",
    },
    {
      label: t("returns", "Returns"),
      href: "/returns",
      icon: RotateCcw,
    },
    {
      label: t("expenses", "Expenses"),
      href: "/expenses",
      icon: Receipt,
    },
    {
      label: t("products", "Products"),
      href: "/products",
      icon: Package,
    },
    {
      label: t("customers", "Customers"),
      href: "/customers",
      icon: Users,
    },
    {
      label: t("settings", "Settings"),
      href: "/settings",
      icon: Settings,
    },
  ];

  // Filter navigation items based on role (Task 2)
  // CASHIER / Employee ONLY sees: Billing, Invoices, Udhari, Returns, Customers
  // CASHIER MUST NOT see: Dashboard, Expenses, Products, Settings
  const visibleNavItems = navItems.filter((item) => {
    if (isCashier) {
      return (
        item.href === "/billing/new" ||
        item.href === "/invoices" ||
        item.href === "/udhari" ||
        item.href === "/returns" ||
        item.href === "/customers"
      );
    }
    return true;
  });

  const isRouteActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/dashboard/";
    }
    if (href === "/billing/new") {
      return pathname.startsWith("/billing");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="p-3 space-y-1.5" aria-label="Sidebar Navigation">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const active = isRouteActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={() => onNavigate?.()}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 select-none ${
              active
                ? "bg-[#7C3AED] text-white font-semibold border-l-4 border-[#F59E0B] shadow-sm shadow-purple-900/30"
                : "bg-transparent text-[#9CA3AF] hover:bg-white/5 hover:text-white font-medium border-l-4 border-transparent"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                active ? "text-white" : "text-[#9CA3AF] group-hover:text-white"
              }`}
            />
            <span className="flex-1 truncate tracking-tight">{item.label}</span>
            {item.badge && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full font-mono shrink-0 transition-colors ${
                  active
                    ? "bg-white/20 text-white"
                    : item.badgeVariant === "red"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default SidebarNav;

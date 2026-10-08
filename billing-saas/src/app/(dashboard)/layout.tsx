import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Receipt, 
  FileSpreadsheet, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  PlusCircle,
  Home,
  Store,
  User as UserIcon,
  CreditCard
} from "lucide-react";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/layouts/logout-button";
import { PwaInstallButton, SyncStatusBadge } from "@/components/shared";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const businessName = session?.user?.businessName || "BillingSaaS Shop";
  const shopType = session?.user?.shopType ? session.user.shopType.replace(/_/g, " ") : "Store";
  const userName = session?.user?.name || "Shop Admin";

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Bill", href: "/billing/new", icon: PlusCircle, highlight: true },
    { label: "Invoices", href: "/invoices", icon: FileSpreadsheet },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Products / Services", href: "/products", icon: Package },
    { label: "Reports & GST", href: "/reports", icon: BarChart3 },
    { label: "Plans & Billing", href: "/subscription", icon: CreditCard },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between">
        <div>
          {/* Business & Tenant Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm tracking-tight text-slate-900 truncate" title={businessName}>
                  {businessName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 capitalize truncate">
                    {shopType.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    item.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Shop Footer with Logout */}
        <div className="p-3 border-t border-slate-200 space-y-1">
          <div className="px-3 py-2 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate">{session?.user?.mobile || ""}</p>
            </div>
          </div>

          <LogoutButton />

          <div className="pt-1">
            <PwaInstallButton className="w-full justify-center" />
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <Home className="h-3.5 w-3.5" /> Back to Landing
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Store className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm block truncate max-w-[140px]">{businessName}</span>
              <span className="text-[10px] text-slate-500 block capitalize">{shopType.toLowerCase()}</span>
            </div>
          </div>

          <div className="hidden md:block">
            <span className="text-xs font-medium text-slate-500">Welcome, </span>
            <span className="text-xs font-bold text-slate-800">{userName}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <SyncStatusBadge />
            <PwaInstallButton className="hidden sm:inline-flex" />
            <Link
              href="/invoices"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" /> Invoices
            </Link>
            <Link
              href="/billing/new"
              className="text-xs font-bold px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="h-4 w-4" /> + New Bill
            </Link>
            <div className="md:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

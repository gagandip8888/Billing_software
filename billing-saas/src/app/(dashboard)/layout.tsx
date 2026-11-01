import React from "react";
import Link from "next/link";
import { Store, User as UserIcon, Home } from "lucide-react";
import { auth } from "@/lib/auth";
import { SidebarNav, TopNavbar, TopProgressBar } from "@/components/layouts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout ONLY fetches user session - zero heavy DB queries for maximum speed
  const session = await auth();
  const businessName = session?.user?.businessName || "BillingSaaS Shop";
  const shopType = session?.user?.shopType ? session.user.shopType.replace(/_/g, " ") : "Store";
  const userName = session?.user?.name || "Shop Admin";
  const userMobile = session?.user?.mobile || "";
  const userRole = session?.user?.role || "ADMIN";

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 text-slate-900">
      {/* Instant 0ms progress bar on navigation */}
      <TopProgressBar />

      {/* Main Desktop Sidebar - STICKY and does not scroll with page content */}
      <aside className="w-64 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 text-slate-100 hidden md:flex flex-col justify-between shrink-0 select-none overflow-y-auto">
        <div>
          {/* Business & Tenant Header */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-purple-900/40 shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm tracking-tight text-white truncate" title={businessName}>
                  {businessName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/40 capitalize truncate">
                    {shopType.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <SidebarNav />
        </div>

        {/* User / Shop Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="px-3 py-2 flex items-center gap-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <div className="h-7 w-7 rounded-full bg-[#7C3AED]/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{userMobile || userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Clean Merged Top Navbar */}
        <TopNavbar
          businessName={businessName}
          shopType={shopType}
          userName={userName}
          userRole={userRole}
          userMobile={userMobile}
        />

        {/* Only the main page content scrolls, preventing horizontal page overflow */}
        <main className="p-3 sm:p-6 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

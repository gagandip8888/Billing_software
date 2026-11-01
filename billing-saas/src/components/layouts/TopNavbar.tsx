"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  User as UserIcon,
  Store,
  Menu,
  X,
  Settings,
  LogOut,
  ExternalLink,
  Receipt,
  Package,
  Users,
  Loader2,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { SidebarNav } from "./SidebarNav";
import { useLanguage } from "@/lib/language-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavbarProps {
  businessName: string;
  shopType: string;
  userName: string;
  userRole?: string;
  userMobile?: string;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
}

export function TopNavbar({
  businessName,
  shopType,
  userName,
  userRole = "ADMIN",
  userMobile = "",
}: TopNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{
    invoices: SearchItem[];
    products: SearchItem[];
    customers: SearchItem[];
  }>({ invoices: [], products: [], customers: [] });
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Low stock notification state (includes specific productId)
  const [lowStockItems, setLowStockItems] = useState<
    Array<{ id: string; productId?: string | null; name: string; stockQty: number; lowStockAlert: number }>
  >([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLowStock = async () => {
      try {
        const res = await fetch("/api/products?lowStock=true");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.products)) {
            // Strict check: ONLY show if product stockQty is <= lowStockAlert (default 5)
            const strictlyLow = data.products
              .filter((p: any) => {
                if (p.stockQty === null || p.stockQty === undefined) return false;
                const threshold = Number(
                  p.lowStockAlert !== null && p.lowStockAlert !== undefined ? p.lowStockAlert : 5
                );
                return Number(p.stockQty) <= threshold;
              })
              .map((p: any) => ({
                id: p.id,
                productId: p.productId || null,
                name: p.name,
                stockQty: Number(p.stockQty || 0),
                lowStockAlert: Number(
                  p.lowStockAlert !== null && p.lowStockAlert !== undefined ? p.lowStockAlert : 5
                ),
              }));
            setLowStockItems(strictlyLow);
          }
        }
      } catch (e) {
        // Safe fallback
      }
    };

    fetchLowStock();

    const handleRefresh = () => fetchLowStock();
    window.addEventListener("billingsaas:sync-complete", handleRefresh);
    window.addEventListener("billingsaas:bill-saved", handleRefresh);
    window.addEventListener("products:updated", handleRefresh);
    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    // Auto-poll every 15 seconds to keep notification bell count completely real-time
    const interval = setInterval(fetchLowStock, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("billingsaas:sync-complete", handleRefresh);
      window.removeEventListener("billingsaas:bill-saved", handleRefresh);
      window.removeEventListener("products:updated", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [pathname]);

  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SA";

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowResults(true);
      }
      if (e.key === "Escape") {
        setShowResults(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults({ invoices: [], products: [], customers: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowResults(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const hasAnyResults =
    results.invoices.length > 0 ||
    results.products.length > 0 ||
    results.customers.length > 0;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        {/* Left Section: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white shadow-sm shrink-0">
              <Store className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm block truncate max-w-[130px] sm:max-w-[200px] text-slate-900">
                {businessName}
              </span>
              <span className="text-[10px] text-slate-500 block capitalize leading-none">
                {shopType.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Clean Search Bar */}
        <div className="flex-1 max-w-md mx-4 relative" ref={searchContainerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => {
                if (query.trim()) setShowResults(true);
              }}
              placeholder={t("searchPlaceholder", "Search bills, items, khata... (Ctrl+K)")}
              className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition"
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  router.push(`/invoices?search=${encodeURIComponent(query.trim())}`);
                  setShowResults(false);
                }
              }}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching ? (
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
              ) : (
                <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm pointer-events-none">
                  ⌘K
                </span>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && query.trim().length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto space-y-3">
              {!isSearching && !hasAnyResults ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching bills, products, or customers found for &quot;{query}&quot;
                </div>
              ) : null}

              {/* Matching Invoices */}
              {results.invoices.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                    <Receipt className="h-3 w-3 text-[#7C3AED]" /> Invoices
                  </div>
                  <div className="space-y-0.5">
                    {results.invoices.map((inv) => (
                      <Link
                        key={inv.id}
                        href={inv.href}
                        onClick={() => setShowResults(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs transition group"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-[#7C3AED] truncate">
                            {inv.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{inv.subtitle}</p>
                        </div>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0 ml-2">
                          {inv.badge}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Products */}
              {results.products.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                    <Package className="h-3 w-3 text-blue-600" /> Products / Items
                  </div>
                  <div className="space-y-0.5">
                    {results.products.map((p) => (
                      <Link
                        key={p.id}
                        href={p.href}
                        onClick={() => setShowResults(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs transition group"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{p.subtitle}</p>
                        </div>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0 ml-2">
                          {p.badge}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Customers */}
              {results.customers.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-red-600" /> Customers / Khata
                  </div>
                  <div className="space-y-0.5">
                    {results.customers.map((c) => (
                      <Link
                        key={c.id}
                        href={c.href}
                        onClick={() => setShowResults(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs transition group"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-red-600 truncate">
                            {c.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{c.subtitle}</p>
                        </div>
                        <span className="font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded text-[11px] shrink-0 ml-2">
                          {c.badge}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Low Stock Notification Bell & User Avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Low Stock Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 select-none"
                title="Low Stock Notifications"
                aria-label="Low Stock Notifications"
              >
                <Bell className="h-5 w-5" />
                {lowStockItems.length > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {lowStockItems.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 shadow-xl border-slate-200 bg-white">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Low Stock Notifications</span>
                </div>
                {lowStockItems.length > 0 ? (
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                    {lowStockItems.length} items low
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    Stock Healthy
                  </span>
                )}
              </div>

              <div className="py-1 max-h-64 overflow-y-auto divide-y divide-slate-50">
                {lowStockItems.length === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs font-semibold text-slate-700">All products in stock! 👍</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No products currently below alert limit</p>
                  </div>
                ) : (
                  lowStockItems.map((item) => (
                    <Link
                      key={item.id}
                      href="/products?filter=low_stock"
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-amber-50/80 transition group text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-800 group-hover:text-amber-900 truncate flex items-center gap-1.5">
                          <span>{item.name} - <strong className="text-red-600 font-bold">{item.stockQty} left</strong></span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Alert threshold: ≤ {item.lowStockAlert} units {item.productId ? `• ID: ${item.productId}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-2xs">
                        {item.stockQty} left
                      </span>
                    </Link>
                  ))
                )}
              </div>

              {lowStockItems.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href="/products?filter=low_stock"
                    className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1 rounded hover:bg-blue-50 transition"
                  >
                    View Low Stock in Products &rarr;
                  </Link>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar & Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 select-none"
              >
                <div className="h-8 w-8 rounded-full bg-[#7C3AED] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {userInitials}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-none">
                    {userRole}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border-slate-200 bg-white">
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-xs font-bold text-slate-900">{userName}</p>
                <p className="text-[10px] text-slate-500 truncate">{businessName}</p>
                {userMobile && (
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{userMobile}</p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  prefetch={true}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer rounded-md"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-500" />
                  <span>Settings & Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/billing/new"
                  prefetch={true}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer rounded-md"
                >
                  <Receipt className="h-3.5 w-3.5 text-slate-500" />
                  <span>Billing Counter</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-md font-medium"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-white flex flex-col justify-between z-10 shadow-2xl">
            <div>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shadow-sm">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate max-w-[140px]">{businessName}</p>
                    <span className="text-[10px] text-purple-300 capitalize">{shopType.toLowerCase()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="h-7 w-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs font-bold">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{userMobile}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopNavbar;

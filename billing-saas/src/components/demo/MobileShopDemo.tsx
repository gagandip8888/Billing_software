"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, BarChart3, ChevronRight, CreditCard, Home, Package, ReceiptText, Search, Shirt, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import styles from "./ClothingShopDemo.module.css";
import { DEMO_SALES_LAST_7_DAYS, DEMO_UDHARI_CUSTOMERS, MOBILE_STOCK_ITEMS } from "@/lib/demo-data";

type MobileView = "home" | "stock" | "udhari" | "bills" | "reports";

const mobileTabs = [
  { id: "home", label: "Home", href: "/demo/mobile", icon: Home },
  { id: "bills", label: "Bills", href: "/demo/mobile/bills", icon: ReceiptText },
  { id: "stock", label: "Stock", href: "/demo/mobile/stock", icon: Package },
  { id: "reports", label: "Reports", href: "/demo/mobile/reports", icon: BarChart3 },
] as const;

const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function MobileShopDemo({ view }: { view: MobileView }) {
  return (
    <main className={styles.phoneStage}>
      <div className={styles.phoneFrame}>
        <div className={styles.phoneNotch} />
        <div className={styles.phoneScreen}>
          <header className={styles.mobileHeader}>
            <div><h1>{view === "stock" ? "Stock · 312 items" : view === "udhari" ? "Udhari · 4 customers" : view === "bills" ? "Bills · Today" : view === "reports" ? "Reports" : "YOUR SHOP"}</h1>{view === "home" && <span className={styles.mobileLive}><i />Live</span>}</div>
            {view !== "home" && <span className={styles.mobileDate}>09 Oct 2026</span>}
          </header>
          <div className={styles.mobileContent}>
            {view === "home" && <MobileHome />}
            {view === "stock" && <MobileStock />}
            {view === "udhari" && <MobileUdhari />}
            {view === "bills" && <MobileBills />}
            {view === "reports" && <MobileReports />}
          </div>
          <nav className={styles.mobileTabs} aria-label="Mobile navigation">
            {mobileTabs.map(({ id, label, href, icon: Icon }) => <Link key={id} href={href} className={`${styles.mobileTab} ${view === id ? styles.mobileTabActive : ""}`}><Icon size={18} strokeWidth={1.9} /><span>{label}</span></Link>)}
          </nav>
        </div>
      </div>
      <Link className={styles.returnDesktop} href="/demo/billing">Open desktop demo <ChevronRight size={14} /></Link>
    </main>
  );
}

function MobileHome() {
  return <>
    <section className={styles.mobileSalesHero}><span>Today&apos;s sales</span><strong>₹48,750</strong><small>37 bills <i>·</i> 96 pieces</small><div className={styles.heroSparkline}><span /><span /><span /><span /><span /><span /><span /></div></section>
    <div className={styles.mobilePaymentGrid}>
      <MobileMetric icon={Banknote} label="Cash" value="₹21,300" color="green" />
      <MobileMetric icon={CreditCard} label="UPI" value="₹22,950" color="purple" />
      <MobileMetric icon={CreditCard} label="Card" value="₹4,500" color="blue" />
      <Link href="/demo/dashboard" className={`${styles.mobileMetric} ${styles.moreMetric}`}><span className={styles.mobileMetricIcon}><BarChart3 size={16} /></span><span className={styles.mobileMetricInfo}><small>More</small><strong>Overview</strong></span><ChevronRight size={14} /></Link>
    </div>
    <section className={styles.mobileChartSection}><div className={styles.mobileSectionHead}><h2>Last 7 days</h2><span>₹ thousands</span></div><MobileSalesChart height={146} /></section>
    <div className={styles.mobileBottomMetrics}><Link href="/demo/mobile/stock" className={styles.mobileLowStock}><span>LOW STOCK</span><strong>12</strong><small>items to reorder</small></Link><Link href="/demo/mobile/udhari" className={styles.mobileUdhariCard}><span>UDHARI</span><strong>₹18,400</strong><small>4 customers</small></Link></div>
  </>;
}

function MobileMetric({ icon: Icon, label, value, color }: { icon: typeof Banknote; label: string; value: string; color: string }) {
  return <div className={styles.mobileMetric}><span className={`${styles.mobileMetricIcon} ${styles[`mobileIcon${color}`]}`}><Icon size={16} /></span><span className={styles.mobileMetricInfo}><small>{label}</small><strong>{value}</strong></span></div>;
}

function MobileSalesChart({ height = 182 }: { height?: number }) {
  return <div className={styles.mobileChart} style={{ height }}><ResponsiveContainer width="100%" height="100%"><BarChart data={DEMO_SALES_LAST_7_DAYS} margin={{ top: 8, right: 0, left: -31, bottom: 0 }}><CartesianGrid vertical={false} stroke="#efedf3" strokeDasharray="3 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9693a0", fontSize: 9 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#9693a0", fontSize: 8 }} /><Tooltip formatter={(value) => [`₹${value},000`, "Sales"]} /><Bar dataKey="sales" radius={[3, 3, 0, 0]}>{DEMO_SALES_LAST_7_DAYS.map((entry, index) => <Cell key={entry.day} fill={index === 6 ? "#7c3aed" : "#c7b1eb"} />)}</Bar></BarChart></ResponsiveContainer></div>;
}

function MobileStock() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const visibleItems = useMemo(() => MOBILE_STOCK_ITEMS.filter((item) => (filter === "All" || item.category === filter) && `${item.item} ${item.code} ${item.size} ${item.colour}`.toLowerCase().includes(query.toLowerCase())), [filter, query]);
  return <>
    <label className={styles.mobileSearch}><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search item, size, colour..." /></label>
    <div className={styles.mobileFilters}>{["All", "Shirts", "Jeans"].map((name) => <button key={name} onClick={() => setFilter(name)} className={filter === name ? styles.mobileFilterActive : ""}>{name}</button>)}</div>
    <div className={styles.mobileStockList}>{visibleItems.map((item) => <article className={styles.mobileStockCard} key={item.code}><div className={styles.mobileStockTitle}><div><h2>{item.item}</h2><p>{item.size} · {item.colour} · {item.code}</p></div><strong className={item.qty <= 4 ? styles.mobileStockLow : ""}>{item.qty}</strong></div><div className={styles.mobileStockBottom}><span>{item.qty <= 4 ? "Low stock" : "In stock"}</span><strong>{money(item.price)}</strong></div></article>)}{visibleItems.length === 0 && <p className={styles.mobileEmpty}>No matching stock items.</p>}</div>
  </>;
}

function MobileUdhari() {
  return <>
    <section className={styles.udhariHero}><span>TOTAL PENDING</span><strong>₹18,400</strong><small>Tap a name to see bills</small><div className={styles.udhariHeroMark}>₹</div></section>
    <div className={styles.mobileListLabel}>CUSTOMERS <span>4</span></div>
    <div className={styles.udhariList}>{DEMO_UDHARI_CUSTOMERS.map((customer) => <button className={styles.udhariCustomer} key={customer.name} onClick={() => window.alert(`${customer.name} · ${money(customer.amount)} pending`)}><span className={styles.customerInitial}>{customer.name.split(" ").map((part) => part[0]).join("")}</span><span className={styles.udhariIdentity}><strong>{customer.name}</strong><small>{customer.phone}</small></span><span className={styles.udhariAmount}>{money(customer.amount)}<small>pending</small></span><ChevronRight size={15} /></button>)}</div>
  </>;
}

function MobileBills() {
  return <div className={styles.mobileBillList}><article><span className={styles.mobileBillIcon}><ReceiptText size={16} /></span><span><strong>INV-1042</strong><small>Suresh Patil · UPI</small></span><b>₹4,725</b></article><article><span className={styles.mobileBillIcon}><ReceiptText size={16} /></span><span><strong>INV-1041</strong><small>Walk-in Customer · Cash</small></span><b>₹2,350</b></article><article><span className={styles.mobileBillIcon}><ReceiptText size={16} /></span><span><strong>INV-1040</strong><small>Anita Deshmukh · UPI</small></span><b>₹1,850</b></article></div>;
}

function MobileReports() {
  return <><section className={styles.mobileReportSummary}><span>TODAY&apos;S SALES</span><strong>₹48,750</strong><small>37 bills · 96 pieces</small></section><section className={styles.mobileChartSection}><div className={styles.mobileSectionHead}><h2>Last 7 days</h2><span>₹ thousands</span></div><MobileSalesChart height={220} /></section><div className={styles.mobileReportRows}><div><span>Cash</span><strong>₹21,300</strong></div><div><span>UPI</span><strong>₹22,950</strong></div><div><span>Card</span><strong>₹4,500</strong></div></div></>;
}

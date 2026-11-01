"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  FileClock,
  LayoutDashboard,
  Package,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Tag,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./ClothingShopDemo.module.css";
import {
  DEMO_BILL_ITEMS,
  DEMO_SALES_LAST_7_DAYS,
  DEMO_STOCK_ITEMS,
  type DemoBillItem,
} from "@/lib/demo-data";

type Page = "billing" | "dashboard" | "stock" | "purchase" | "customers" | "reports" | "settings";

const navItems = [
  { id: "billing", label: "Billing", href: "/demo/billing", icon: ReceiptText },
  { id: "dashboard", label: "Dashboard", href: "/demo/dashboard", icon: LayoutDashboard },
  { id: "stock", label: "Stock", href: "/demo/stock", icon: Package },
  { id: "purchase", label: "Purchase", href: "/demo/billing", icon: ShoppingBag },
  { id: "customers", label: "Customers", href: "/demo/billing", icon: Users },
  { id: "reports", label: "Reports", href: "/demo/dashboard", icon: BarChart3 },
  { id: "settings", label: "Settings", href: "/demo/dashboard", icon: Settings },
] as const;

const formatMoney = (amount: number) => amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ClothingShopDemo({ page }: { page: Page }) {
  const [items, setItems] = useState<DemoBillItem[]>(() => DEMO_BILL_ITEMS.map((item) => ({ ...item })));
  const [payment, setPayment] = useState("UPI");
  const [search, setSearch] = useState("");
  const [stockTab, setStockTab] = useState("All");
  const [customer, setCustomer] = useState({ name: "Suresh Patil", phone: "98XXXXXXXX21" });
  const [notice, setNotice] = useState("");
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const discount = Math.min(244, subtotal);
  const taxable = subtotal - discount;
  const cgst = taxable * 0.025;
  const sgst = taxable * 0.025;
  const total = taxable + cgst + sgst;
  const pieces = items.reduce((sum, item) => sum + item.qty, 0);
  const filteredStock = useMemo(() => DEMO_STOCK_ITEMS.filter((item) => stockTab === "All" || item.category === stockTab), [stockTab]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('input[aria-label="Search items"]')?.focus();
      }
      if (event.key === "F9" && page === "billing") {
        event.preventDefault();
        window.location.assign("/demo/print/INV-1042");
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [page]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addSearchItem() {
    const term = search.trim().toLowerCase();
    if (!term) return;
    const match = DEMO_STOCK_ITEMS.find((item) => item.code.toLowerCase() === term || item.item.toLowerCase().includes(term));
    if (!match) return flash("No matching item in this demo catalog.");
    setItems((current) => {
      const existing = current.find((item) => item.code === match.code);
      return existing
        ? current.map((item) => item.code === match.code ? { ...item, qty: item.qty + 1 } : item)
        : [...current, { ...match, rate: match.price }];
    });
    setSearch("");
  }

  function updateQty(code: string, change: number) {
    setItems((current) => current
      .map((item) => item.code === code ? { ...item, qty: item.qty + change } : item)
      .filter((item) => item.qty > 0));
  }

  const pageTitle: Record<Page, string> = {
    billing: "New Bill · INV-1042 · 09 Oct 2026",
    dashboard: "Dashboard · 09 Oct 2026",
    stock: "Stock · 1,248 pieces · 312 items",
    purchase: "Purchase · 09 Oct 2026",
    customers: "Customers · 486 customers",
    reports: "Reports · 09 Oct 2026",
    settings: "Settings · Shop profile",
  };

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/demo/billing" aria-label="Go to Billing">
          <span className={styles.brandMark}><Shirt size={19} strokeWidth={2.2} /></span>
          <span className={styles.brandText}><strong>YOUR SHOP</strong><small>Clothing & Apparel</small></span>
        </Link>
        <div className={styles.navCaption}>WORKSPACE</div>
        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map(({ id, label, href, icon: Icon }) => (
            <Link key={id} href={href} className={`${styles.navItem} ${page === id ? styles.navActive : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {id === "billing" && page === id && <span className={styles.navDot} />}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.helpLink}><CircleHelp size={16} /> Help & support</div>
          <div className={styles.userBadge}>
            <div className={styles.avatar}>SP</div>
            <div className={styles.userInfo}><strong>Shop Owner</strong><span>Owner account</span></div>
            <ChevronDown size={15} className={styles.userChevron} />
          </div>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.pageHeading}>
            <span className={styles.mobileBrand}><Shirt size={17} /> YOUR SHOP</span>
            <h1>{pageTitle[page]}</h1>
          </div>
          <div className={styles.topActions}>
            {page === "billing" && <Link className={styles.previewButton} href="/demo/print/INV-1042"><Printer size={15} /> <span>Print view</span></Link>}
            <span className={styles.savedBadge}><span className={styles.savedDot} /> Cloud-saved</span>
            <span className={styles.counterBadge}>{page === "billing" ? "Counter 1" : "Owner"}</span>
            <button className={styles.iconButton} aria-label="Notifications"><Bell size={17} /></button>
          </div>
        </header>

        <main className={styles.main}>
          {page === "billing" ? (
            <BillingView items={items} search={search} setSearch={setSearch} addSearchItem={addSearchItem} updateQty={updateQty} payment={payment} setPayment={setPayment} customer={customer} setCustomer={setCustomer} subtotal={subtotal} discount={discount} taxable={taxable} cgst={cgst} sgst={sgst} total={total} pieces={pieces} onPrint={() => window.location.assign("/demo/print/INV-1042")} flash={flash} />
          ) : page === "dashboard" ? (
            <DashboardView />
          ) : page === "stock" ? (
            <StockView activeTab={stockTab} setActiveTab={setStockTab} items={filteredStock} />
          ) : (
            <SimpleView page={page} />
          )}
        </main>
        {notice && <div className={styles.toast}><Check size={15} />{notice}</div>}
      </section>
    </div>
  );
}

export function DemoPrint() {
  const items = DEMO_BILL_ITEMS;
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const discount = 244;
  const taxable = subtotal - discount;
  const cgst = taxable * 0.025;
  const sgst = taxable * 0.025;

  return (
    <main className={styles.printRoute}>
      <ReceiptView
        items={items}
        customer={{ name: "Suresh Patil", phone: "98XXXXXXXX21" }}
        subtotal={subtotal}
        discount={discount}
        taxable={taxable}
        cgst={cgst}
        sgst={sgst}
        total={taxable + cgst + sgst}
        onBack={() => window.location.assign("/demo/billing")}
      />
    </main>
  );
}

function BillingView({ items, search, setSearch, addSearchItem, updateQty, payment, setPayment, customer, setCustomer, subtotal, discount, taxable, cgst, sgst, total, pieces, onPrint, flash }: any) {
  return (
    <div className={styles.billingLayout}>
      <section className={styles.billingContent}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addSearchItem()} placeholder="Scan barcode or type item name / code..." aria-label="Search items" />
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
          <button className={styles.shortcut} onClick={() => document.querySelector<HTMLInputElement>(`input[aria-label="Search items"]`)?.focus()}>F2</button>
        </div>
        <div className={styles.tablePanel}>
          <div className={styles.tableScroll}>
            <table className={styles.billTable}>
              <thead><tr><th>#</th><th>Code</th><th>Item</th><th>Size</th><th>Colour</th><th className={styles.center}>Qty</th><th className={styles.right}>Rate</th><th className={styles.right}>Amount</th></tr></thead>
              <tbody>{items.length === 0 ? <tr><td colSpan={8} className={styles.emptyRow}>No items on this bill yet. Search for an item above.</td></tr> : items.map((item: DemoBillItem, index: number) => (
                <tr key={item.code}>
                  <td className={styles.rowNumber}>{String(index + 1).padStart(2, "0")}</td><td className={styles.code}>{item.code}</td><td className={styles.itemName}>{item.item}</td><td>{item.size}</td><td><span className={styles.colourCell}><i className={`${styles.swatch} ${styles[`swatch${item.colour}`] || ""}`} />{item.colour}</span></td>
                  <td><div className={styles.quantity}><button onClick={() => updateQty(item.code, -1)} aria-label={`Remove one ${item.item}`}>−</button><span>{item.qty}</span><button onClick={() => updateQty(item.code, 1)} aria-label={`Add one ${item.item}`}>+</button></div></td>
                  <td className={`${styles.money} ${styles.right}`}>{formatMoney(item.rate)}</td><td className={`${styles.money} ${styles.right} ${styles.amount}`}>{formatMoney(item.qty * item.rate)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className={styles.tableFooter}><span>{items.length} items <b>·</b> {pieces} pieces</span><span>Bill discount <strong>₹{formatMoney(discount)}</strong></span></div>
        </div>
        <div className={styles.billActions}>
          <button onClick={() => flash("Return / exchange panel opened")}><FileClock size={15} /> Return / Exchange</button>
          <button onClick={() => flash("Bill held at Counter 1")}><WalletCards size={15} /> Hold bill</button>
          <button onClick={() => flash("Showing recent bills")}><ReceiptText size={15} /> Old bills</button>
          <button onClick={() => setCustomer({ name: "Walk-in Customer", phone: "Add phone number" })}><Plus size={15} /> Add customer</button>
        </div>
        <div className={styles.tipLine}><span className={styles.tipIcon}>i</span> Tip: scan a barcode or type an item code, then press Enter to add it.</div>
      </section>

      <aside className={styles.billSummary}>
        <section className={styles.customerSection}>
          <div className={styles.sectionLabel}>CUSTOMER <button onClick={() => setCustomer({ name: "Suresh Patil", phone: "98XXXXXXXX21" })}>Change</button></div>
          <div className={styles.customerName}>{customer.name}</div><div className={styles.customerPhone}>{customer.phone}</div>
        </section>
        <section className={styles.amountSection}>
          <div className={styles.sectionLabel}>AMOUNTS</div>
          <div className={styles.amountLine}><span>Subtotal</span><strong>₹{formatMoney(subtotal)}</strong></div>
          <div className={styles.amountLine}><span>Discount</span><strong className={styles.discount}>− ₹{formatMoney(discount)}</strong></div>
          <div className={styles.amountLine}><span>Taxable amount</span><strong>₹{formatMoney(taxable)}</strong></div>
          <div className={styles.amountLine}><span>CGST <small>2.5%</small></span><strong>₹{formatMoney(cgst)}</strong></div>
          <div className={styles.amountLine}><span>SGST <small>2.5%</small></span><strong>₹{formatMoney(sgst)}</strong></div>
        </section>
        <div className={styles.totalBlock}><span>TOTAL AMOUNT</span><strong><small>₹</small>{formatMoney(total)}</strong></div>
        <div className={styles.sectionLabel}>PAYMENT MODE</div>
        <div className={styles.paymentModes}>
          {[{ name: "Cash", icon: Banknote }, { name: "UPI", icon: QrCode }, { name: "Card", icon: CreditCard }].map(({ name, icon: Icon }) => <button key={name} onClick={() => setPayment(name)} className={payment === name ? styles.paymentActive : ""}><Icon size={15} />{name}</button>)}
        </div>
        <button className={styles.saveButton} onClick={onPrint}><Printer size={17} /> Save & Print <span>(F9)</span></button>
        <button className={styles.whatsappButton} onClick={() => flash("WhatsApp bill is ready to share")}><span className={styles.whatsappMark}>◔</span> WhatsApp bill</button>
      </aside>
    </div>
  );
}

function DashboardView() {
  return (
    <div className={styles.dashboardPage}>
      <div className={styles.statGrid}>
        <StatCard label="Today's sales" value="₹48,750" icon={Banknote} accent="purple" change="↑ 12.8% vs yesterday" />
        <StatCard label="Bills" value="37" icon={ReceiptText} accent="green" change="Across 2 counters" />
        <StatCard label="Pieces sold" value="96" icon={Shirt} accent="blue" change="Across 11 categories" />
        <StatCard label="Low stock items" value="12" icon={Package} accent="orange" change="Needs attention" warn />
      </div>
      <div className={styles.dashboardGrid}>
        <section className={styles.chartPanel}>
          <PanelHeading title="Sales, last 7 days" detail="₹ thousand" action="This week" />
          <div className={styles.chartPlot}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMO_SALES_LAST_7_DAYS} margin={{ top: 12, right: 4, left: -17, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#efedf3" strokeDasharray="3 4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9693a0", fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9693a0", fontSize: 9 }} tickFormatter={(value) => `${value}`} />
                <Tooltip formatter={(value) => [`₹${value},000`, "Sales"]} cursor={{ fill: "#f7f4fc" }} />
                <Bar dataKey="sales" radius={[3, 3, 0, 0]}>
                  {DEMO_SALES_LAST_7_DAYS.map((entry, index) => <Cell key={entry.day} fill={index === 6 ? "#7c3aed" : "#c7b1eb"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className={styles.listPanel}><PanelHeading title="Payment modes today" detail="37 bills" /><div className={styles.metricList}><MetricRow icon={Banknote} label="Cash" value="₹21,300" percent={44} color="green" /><MetricRow icon={QrCode} label="UPI" value="₹22,950" percent={47} color="purple" /><MetricRow icon={CreditCard} label="Card" value="₹4,500" percent={9} color="blue" /></div><div className={styles.panelFoot}>Total collected <strong>₹48,750</strong></div></section>
        <section className={styles.listPanel}><PanelHeading title="Top categories today" detail="By sales" /><div className={styles.metricList}><MetricRow icon={Shirt} label="Shirts" value="₹15,300" percent={100} color="purple" /><MetricRow icon={ShoppingBag} label="Sarees" value="₹14,100" percent={92} color="orange" /><MetricRow icon={Package} label="Jeans" value="₹10,450" percent={68} color="blue" /></div><div className={styles.panelFoot}>All categories <strong>11 items</strong></div></section>
      </div>
      <section className={styles.recentPanel}><PanelHeading title="Recent bills" detail="Today, 09 Oct" action="View all" /><div className={styles.recentRows}><div><span className={styles.recentNo}>INV-1042</span><span>Suresh Patil</span><span>UPI</span><strong>₹4,725.00</strong><span className={styles.paidLabel}>Paid</span></div><div><span className={styles.recentNo}>INV-1041</span><span>Walk-in Customer</span><span>Cash</span><strong>₹2,350.00</strong><span className={styles.paidLabel}>Paid</span></div></div></section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent, change, warn = false }: any) {
  return <section className={styles.statCard}><div className={`${styles.statIcon} ${styles[`accent${accent}`]}`}><Icon size={18} /></div><div className={styles.statBody}><span>{label}</span><strong className={warn ? styles.warningValue : ""}>{value}</strong><small>{change}</small></div><span className={styles.statMenu}>···</span></section>;
}

function PanelHeading({ title, detail, action }: { title: string; detail?: string; action?: string }) {
  return <div className={styles.panelHeading}><div><h2>{title}</h2>{detail && <span>{detail}</span>}</div>{action && <button>{action}<ChevronDown size={13} /></button>}</div>;
}

function MetricRow({ icon: Icon, label, value, percent, color }: any) {
  return <div className={styles.metricRow}><div className={styles.metricTop}><span><Icon size={15} />{label}</span><strong>{value}</strong></div><div className={styles.progressTrack}><i className={`${styles[`progress${color}`]}`} style={{ width: `${percent}%` }} /></div></div>;
}

function StockView({ activeTab, setActiveTab, items }: any) {
  const tabs = ["All", "Shirts", "Jeans", "Kurtis", "Sarees", "Kids"];
  return <div className={styles.stockPage}>
    <div className={styles.stockToolbar}><div className={styles.tabs}>{tabs.map((tab) => <button key={tab} className={activeTab === tab ? styles.tabActive : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div className={styles.stockButtons}><button onClick={() => alert("Add item to the demo catalog") }><Plus size={15} /> Add Item</button><button onClick={() => window.print()}><Tag size={15} /> Print labels</button></div></div>
    <div className={styles.stockTablePanel}><div className={styles.stockTableScroll}><table className={styles.stockTable}><thead><tr><th>Code</th><th>Item</th><th>Category</th><th>Size</th><th>Colour</th><th className={styles.right}>In stock</th><th className={styles.right}>Price ₹</th></tr></thead><tbody>{items.map((item: (typeof DEMO_STOCK_ITEMS)[number]) => <tr key={item.code}><td className={styles.code}>{item.code}</td><td className={styles.itemName}>{item.item}</td><td><span className={styles.categoryLabel}>{item.category}</span></td><td>{item.size}</td><td><span className={styles.colourCell}><i className={`${styles.swatch} ${styles[`swatch${item.colour}`] || ""}`} />{item.colour}</span></td><td className={`${styles.right} ${item.qty <= 4 ? styles.lowQty : styles.stockQty}`}>{item.qty <= 4 && <span className={styles.lowDot} />}{item.qty}</td><td className={`${styles.money} ${styles.right}`}>{item.price.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div><div className={styles.stockFooter}><span>Showing <strong>{items.length}</strong> of 312 items</span><div><button disabled>Previous</button><button className={styles.pageNumber}>1</button><button>2</button><button>3</button><button>Next</button></div></div></div>
    <div className={styles.stockNote}><span className={styles.lowDot} /> Low stock threshold: 5 pieces <span>·</span> Last synced just now</div>
  </div>;
}

function ReceiptView({ items, customer, subtotal, discount, taxable, cgst, sgst, total, onBack }: any) {
  return <div className={styles.receiptPage}>
    <div className={styles.receiptTools}><div><h2>80mm Thermal Receipt</h2><p>Preview at actual receipt width</p></div><div><button className={styles.outlineButton} onClick={onBack}>Back to bill</button><button className={styles.printButton} onClick={() => window.print()}><Printer size={15} /> Print receipt</button></div></div>
    <article className={styles.receipt}>
      <div className={styles.receiptBrand}><div className={styles.receiptLogo}><Shirt size={18} /></div><h1>YOUR SHOP</h1><p>CLOTHING & APPAREL</p></div>
      <div className={styles.receiptRule} />
      <div className={styles.receiptMeta}><span>Invoice</span><strong>INV-1042</strong><span>Date</span><strong>09 Oct 2026 · 11:42 AM</strong><span>Customer</span><strong>{customer.name}</strong><span>Phone</span><strong>{customer.phone}</strong></div>
      <div className={styles.receiptRule} />
      <div className={styles.receiptItems}><div className={styles.receiptItemHead}><span>ITEM</span><span>QTY</span><span>AMOUNT</span></div>{items.map((item: DemoBillItem) => <div className={styles.receiptItem} key={item.code}><span>{item.item}<small>{item.code} · {item.size} / {item.colour}</small><small>₹{formatMoney(item.rate)} each</small></span><span>{item.qty}</span><strong>₹{formatMoney(item.qty * item.rate)}</strong></div>)}</div>
      <div className={styles.receiptRule} />
      <div className={styles.receiptTotals}><div><span>Subtotal</span><strong>₹{formatMoney(subtotal)}</strong></div><div><span>Discount</span><strong>− ₹{formatMoney(discount)}</strong></div><div><span>Taxable amount</span><strong>₹{formatMoney(taxable)}</strong></div><div><span>CGST (2.5%)</span><strong>₹{formatMoney(cgst)}</strong></div><div><span>SGST (2.5%)</span><strong>₹{formatMoney(sgst)}</strong></div><div className={styles.receiptGrand}><span>TOTAL</span><strong>₹{formatMoney(total)}</strong></div></div>
      <div className={styles.receiptRule} /><div className={styles.receiptPay}><span>Paid by</span><strong>UPI</strong></div><div className={styles.receiptThanks}>Thank you for shopping with us!<small>Goods once sold can be exchanged within 7 days.</small></div><div className={styles.receiptBarcode}>INV-1042 · YOUR SHOP</div>
    </article>
  </div>;
}

function SimpleView({ page }: { page: Page }) {
  const content: Record<string, { intro: string; rows: [string, string, string][] }> = {
    purchase: { intro: "Recent stock purchases", rows: [["PO-2081", "Shree Garments Wholesale", "₹28,450"], ["PO-2080", "Fashion Hub Distributors", "₹16,800"], ["PO-2079", "City Textile House", "₹32,100"]] },
    customers: { intro: "Recently active customers", rows: [["CUS-0486", "Suresh Patil", "12 bills · ₹18,420"], ["CUS-0485", "Anita Deshmukh", "8 bills · ₹12,750"], ["CUS-0484", "Rahul Joshi", "5 bills · ₹8,990"]] },
    reports: { intro: "Quick sales summary · 09 Oct 2026", rows: [["Gross sales", "37 bills", "₹48,750"], ["Discounts given", "Today", "₹2,140"], ["Tax collected", "CGST + SGST", "₹4,170"]] },
    settings: { intro: "Shop profile", rows: [["Shop name", "YOUR SHOP", "Edit"], ["Business type", "Clothing & Apparel", "Edit"], ["Billing counter", "Counter 1", "Active"]] },
  };
  const data = content[page] ?? content.purchase;
  return <div className={styles.simplePage}><div className={styles.simpleToolbar}><div><h2>{data.intro}</h2><p>Demo data for your client presentation</p></div>{page === "customers" && <button onClick={() => alert("Add customer to the demo") }><Plus size={15} /> Add customer</button>}</div><section className={styles.simplePanel}><div className={styles.simpleHead}><span>REFERENCE</span><span>DETAILS</span><span>SUMMARY</span></div>{data.rows.map((row) => <div className={styles.simpleRow} key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><b>{row[2]}</b></div>)}</section></div>;
}

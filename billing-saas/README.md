# BillingSaaS 🇮🇳 - Offline-First Billing & POS Software for Indian Retail

BillingSaaS is a modern, high-performance, offline-first billing and inventory management application built specifically for Indian Kirana stores, retail shops, supermarkets, pharmacies, electronics outlets, and 30+ SMB business verticals.

---

## ⚡ Key Features

- **Offline-First Billing**: Continue creating invoices even when internet connectivity drops. Local SQLite / IndexedDB sync automatically syncs with PostgreSQL when online.
- **GST Compliance & Invoicing**: Automatic CGST, SGST, and IGST calculations, HSN/SAC code mapping, and GST-ready PDF invoice generation.
- **WhatsApp Bill Sharing**: Send digital receipts directly to customer mobile numbers via WhatsApp.
- **Multi-Tenant Architecture**: Complete data isolation per business/shop using tenant-scoped database queries and middleware.
- **Flexible Subscription Plans**: Free Tier (50 bills/mo), Basic (₹299/mo), Pro (₹599/mo), Enterprise (₹1499/mo) powered by Razorpay API.
- **Comprehensive Reports**: Real-time sales analytics, GST summary reports, top-selling products, customer ledger, and CSV/Excel exports.
- **Thermal Printer & Barcode Support**: Standard POS 80mm/58mm thermal receipt printing and barcode scanner input integration.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions, API Routes)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: NextAuth.js (JWT strategy, credentials & OAuth)
- **Payments**: Razorpay Node SDK (Subscription & Webhooks)
- **Styling & UI**: Tailwind CSS, shadcn/ui, Lucide Icons, Recharts
- **Analytics**: Vercel Analytics

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database running locally or hosted (Supabase, Neon, Railway)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/your-org/billing-saas.git
cd billing-saas

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 3. Environment Variables Configuration

Configure `.env` with your database and API credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/billingsaas?schema=public"
NEXTAUTH_SECRET="your-super-secret-nextauth-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

RAZORPAY_KEY_ID="rzp_test_xxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
```

### 4. Database Setup & Prisma Generation

```bash
# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📦 Deployment & Vercel Configuration

BillingSaaS is optimized for one-click deployment on Vercel:

```bash
# Build & verify type-checking locally
npm run build
```

The repository includes a root `vercel.json` with optimized build commands (`prisma generate && next build`), Mumbai (`bom1`) edge region deployment, and security HTTP headers.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

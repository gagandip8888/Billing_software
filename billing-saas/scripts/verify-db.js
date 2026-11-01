const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  // Check all new tables
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('Tables in database:', tables.map(t => t.table_name));
  } catch (e) {
    console.log('Query tables error:', e.message);
  }
  
  // Try to query each new table
  try {
    const holdCount = await prisma.holdBill.count();
    console.log('HoldBill rows:', holdCount);
  } catch (e) { console.log('HoldBill error:', e.message); }
  
  try {
    const receiptCount = await prisma.paymentReceipt.count();
    console.log('PaymentReceipt rows:', receiptCount);
  } catch (e) { console.log('PaymentReceipt error:', e.message); }
  
  try {
    const cnCount = await prisma.creditNote.count();
    console.log('CreditNote rows:', cnCount);
  } catch (e) { console.log('CreditNote error:', e.message); }
  
  try {
    const srCount = await prisma.salesReturn.count();
    console.log('SalesReturn rows:', srCount);
  } catch (e) { console.log('SalesReturn error:', e.message); }
  
  // Check new fields on Product
  try {
    const product = await prisma.product.findFirst({
      select: { size: true, color: true, brand: true, mrp: true, variantGroupId: true }
    });
    console.log('Product has new fields:', product !== null || 'okay (no rows but fields exist)');
  } catch (e) { console.log('Product fields error:', e.message); }
  
  // Check new fields on Invoice
  try {
    const invoice = await prisma.invoice.findFirst({
      select: { payments: true }
    });
    console.log('Invoice has payments field:', invoice !== null || 'okay');
  } catch (e) { console.log('Invoice fields error:', e.message); }
  
  // Check new fields on Customer
  try {
    const customer = await prisma.customer.findFirst({
      select: { creditBalance: true, totalPaid: true }
    });
    console.log('Customer has creditBalance/totalPaid:', customer !== null || 'okay');
  } catch (e) { console.log('Customer fields error:', e.message); }
  
  await prisma.$disconnect();
})();

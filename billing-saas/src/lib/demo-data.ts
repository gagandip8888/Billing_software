export type DemoBillItem = {
  code: string;
  item: string;
  category: string;
  size: string;
  colour: string;
  qty: number;
  rate: number;
};

export const DEMO_BILL_ITEMS: DemoBillItem[] = [
  { code: "SH-1021", item: "Men's Formal Shirt", category: "Shirts", size: "L", colour: "Blue", qty: 2, rate: 899 },
  { code: "JN-2044", item: "Jeans Slim Fit", category: "Jeans", size: "32", colour: "Black", qty: 1, rate: 1499 },
  { code: "KT-3310", item: "Cotton Kurti", category: "Kurtis", size: "M", colour: "Pink", qty: 1, rate: 749 },
  { code: "KD-4102", item: "Kids T-Shirt", category: "Kids", size: "8Y", colour: "Red", qty: 2, rate: 349 },
];

export const DEMO_STOCK_ITEMS = [
  { code: "SH-1021", item: "Men's Formal Shirt", category: "Shirts", size: "L", colour: "Blue", qty: 14, price: 899 },
  { code: "SH-1022", item: "Men's Formal Shirt", category: "Shirts", size: "XL", colour: "White", qty: 3, price: 899 },
  { code: "JN-2044", item: "Jeans Slim Fit", category: "Jeans", size: "32", colour: "Black", qty: 9, price: 1499 },
  { code: "JN-2046", item: "Jeans Slim Fit", category: "Jeans", size: "34", colour: "Blue", qty: 2, price: 1499 },
  { code: "KT-3310", item: "Cotton Kurti", category: "Kurtis", size: "M", colour: "Pink", qty: 21, price: 749 },
  { code: "SR-5007", item: "Silk Saree", category: "Sarees", size: "Free", colour: "Maroon", qty: 6, price: 2350 },
  { code: "KD-4102", item: "Kids T-Shirt", category: "Kids", size: "8Y", colour: "Red", qty: 17, price: 349 },
  { code: "TR-6015", item: "Men's Trouser", category: "Trousers", size: "34", colour: "Grey", qty: 4, price: 1099 },
];

export const MOBILE_STOCK_ITEMS = [
  DEMO_STOCK_ITEMS[0],
  DEMO_STOCK_ITEMS[1],
  DEMO_STOCK_ITEMS[2],
  DEMO_STOCK_ITEMS[3],
  DEMO_STOCK_ITEMS[7],
];

export const DEMO_SALES_LAST_7_DAYS = [
  { day: "Sat", sales: 32 },
  { day: "Sun", sales: 41 },
  { day: "Mon", sales: 28 },
  { day: "Tue", sales: 46 },
  { day: "Wed", sales: 38 },
  { day: "Thu", sales: 49 },
  { day: "Fri", sales: 37 },
];

export const DEMO_UDHARI_CUSTOMERS = [
  { name: "Suresh Patil", phone: "98XXXXXXXX21", amount: 6200 },
  { name: "Anita Jadhav", phone: "97XXXXXXXX08", amount: 4500 },
  { name: "Mahesh Kale", phone: "90XXXXXXXX55", amount: 3900 },
  { name: "Pooja Shinde", phone: "88XXXXXXXX13", amount: 3800 },
];

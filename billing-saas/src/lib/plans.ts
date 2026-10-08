export type PlanId = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;           // INR per month
  priceYearly: number;     // INR per year (2 months free)
  billLimit: number;       // bills per month (-1 = unlimited)
  userLimit: number;       // staff users
  features: string[];
  popular?: boolean;
  color: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    billLimit: 50,
    userLimit: 1,
    features: [
      '50 bills per month',
      '1 user',
      'Basic billing',
      'A4 invoice print',
      'WhatsApp share',
      'Offline mode',
    ],
    color: 'gray',
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    price: 299,
    priceYearly: 2990, // 10 months price
    billLimit: 500,
    userLimit: 2,
    features: [
      '500 bills per month',
      '2 users',
      'Everything in Free',
      'Thermal print (80mm)',
      'GST reports',
      'Customer ledger',
      'Priority email support',
    ],
    popular: true,
    color: 'blue',
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 599,
    priceYearly: 5990,
    billLimit: 2000,
    userLimit: 5,
    features: [
      '2000 bills per month',
      '5 users',
      'Everything in Basic',
      'Stock management',
      'Advanced reports',
      'Multi-branch',
      'WhatsApp auto-send',
      'Priority WhatsApp support',
    ],
    color: 'purple',
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 1499,
    priceYearly: 14990,
    billLimit: -1, // unlimited
    userLimit: -1,
    features: [
      'Unlimited bills',
      'Unlimited users',
      'Everything in Pro',
      'Custom invoice templates',
      'API access',
      'Dedicated account manager',
      'SLA support',
    ],
    color: 'amber',
  },
};

export const FREE_BILL_LIMIT = PLANS.FREE.billLimit;

export function getPlan(planId?: string | null): PlanConfig {
  if (!planId) return PLANS.FREE;
  const upper = planId.toUpperCase() as PlanId;
  return PLANS[upper] || PLANS.FREE;
}

export function isPlanActive(plan: PlanId, expiryDate?: Date | string | null): boolean {
  if (plan === 'FREE') return true;
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  return expiry.getTime() > Date.now();
}

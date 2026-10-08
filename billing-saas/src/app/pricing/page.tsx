'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Receipt, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free',
      priceMonthly: '₹0',
      priceYearly: '₹0',
      period: 'forever',
      description: 'Perfect for small shops & single counter stores getting started.',
      features: [
        '50 bills / month limit',
        'Basic thermal printing (80mm/58mm)',
        'Standard GST invoice generation',
        'Offline billing support',
        'Community support',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Basic',
      priceMonthly: '₹299',
      priceYearly: '₹2,999',
      period: isYearly ? '/year' : '/month',
      description: 'Ideal for growing retail stores needing unlimited bills.',
      features: [
        'Unlimited bills & invoices',
        'WhatsApp digital bill sharing',
        'Inventory & low-stock alerts',
        'Basic sales & GST reports',
        'Email & chat support',
      ],
      cta: 'Start Basic Plan',
      popular: false,
    },
    {
      name: 'Pro',
      priceMonthly: '₹599',
      priceYearly: '₹5,999',
      period: isYearly ? '/year' : '/month',
      description: 'Most popular for multi-staff shops & busy retail counters.',
      features: [
        'Everything in Basic',
        '3 Staff logins & role permissions',
        'Barcode scanner integration',
        'Advanced GST & profit analytics',
        'Priority WhatsApp support',
      ],
      cta: 'Start Pro Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      priceMonthly: '₹1,499',
      priceYearly: '₹14,999',
      period: isYearly ? '/year' : '/month',
      description: 'For multi-location chains and supermarket outlets.',
      features: [
        'Everything in Pro',
        'Unlimited staff & multi-branch sync',
        'Custom invoice design & branding',
        'Dedicated account manager',
        '24/7 SLA telephone support',
      ],
      cta: 'Contact Enterprise',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <span>Billing<span className="text-indigo-400">SaaS</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Home
            </Link>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Link href="/register">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 px-3 py-1">
            Simple & Transparent Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Plans Tailored for Indian Businesses
          </h1>
          <p className="text-slate-400 text-lg">
            No hidden charges. Upgrade, downgrade, or cancel anytime. All prices in INR (₹).
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="w-14 h-8 bg-slate-800 rounded-full p-1 transition-colors relative border border-slate-700"
            >
              <div
                className={`w-6 h-6 bg-indigo-500 rounded-full transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-slate-400'}`}>
              Yearly <span className="text-emerald-400 font-semibold text-xs ml-1">(Save 17%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <Card
              key={i}
              className={`bg-slate-900 border flex flex-col justify-between relative ${
                plan.popular ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' : 'border-slate-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                <CardDescription className="text-slate-400 text-xs min-h-[36px]">
                  {plan.description}
                </CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {isYearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className="text-slate-400 text-sm font-normal"> {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 pt-2 border-t border-slate-800/60 mt-4">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="pt-4 border-t border-slate-800/60">
                <Button
                  asChild
                  className={`w-full ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Link href="/register" className="flex items-center justify-center gap-2">
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} BillingSaaS Technologies. All prices exclusive of 18% GST.</p>
      </footer>
    </div>
  );
}

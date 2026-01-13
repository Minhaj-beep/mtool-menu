'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  Zap,
  Shield,
  Crown,
  ArrowRight,
  Check,
} from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';

type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  billing_cycle: BillingCycle;
  price_inr: number;
  is_popular: boolean;
  features: Record<string, any>;
  limits: Record<string, any>;
};

/* -----------------------------
   MARKETING FEATURE BUILDER
-------------------------------- */

function getPlanFeatures(plan: SubscriptionPlan): string[] {
  const f = plan.features || {};
  const l = plan.limits || {};

  const features: string[] = [];

  // Core limits
  if (l.dishes === -1) features.push('Unlimited dishes');
  else if (l.dishes) features.push(`${l.dishes} dishes`);

  if (l.categories === -1)
    features.push('Unlimited categories');
  else if (l.categories)
    features.push(`${l.categories} categories`);

  // Photos
  if (f.photos === -1) features.push('Unlimited photos');
  else if (typeof f.photos === 'number' && f.photos > 0)
    features.push(`${f.photos} dish photos`);

  // Branding / trust
  if (f.watermark === false)
    features.push('No watermark');

  if (f.google_review)
    features.push('Google review integration');

  if (f.analytics) features.push('Menu analytics');

  if (f.branding) features.push('Custom branding');

  if (f.white_label) features.push('White-label menu');

  if (f.custom_domain) features.push('Custom domain');

  if (f.dedicated_support)
    features.push('Dedicated support');

  return features.slice(0, 7); // 👈 marketing discipline
}

export default function HomePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>('monthly');
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      const { data } = await supabaseBrowser
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_inr');

      setPlans(data || []);
      setLoadingPlans(false);
    };

    loadPlans();
  }, []);

  const visiblePlans = plans.filter(
    (p) => p.billing_cycle === billingCycle
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* NAV */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="w-8 h-8" />
            <span className="text-xl font-bold">QR Menu</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Digital Menus Made{' '}
          <span className="text-slate-600">Simple</span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
          Create beautiful QR-based menus for your restaurant.
          Update instantly. No apps for customers.
        </p>
        <Link href="/signup">
          <Button size="lg">
            Start Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </section>

      {/* PRICING */}
      <section className="py-24 px-4">
        <h2 className="text-4xl font-bold text-center mb-6">
          Simple Pricing
        </h2>

        {/* Toggle */}
        <div className="flex justify-center mb-14">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            {(['monthly', 'yearly'] as BillingCycle[]).map(
              (cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold ${
                    billingCycle === cycle
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-500'
                  }`}
                >
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                  {cycle === 'yearly' && (
                    <span className="ml-1 text-green-600">
                      Save
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {loadingPlans ? (
          <p className="text-center text-slate-500">
            Loading plans…
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {visiblePlans.map((plan) => {
              const features = getPlanFeatures(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-8 bg-white transition ${
                    plan.is_popular
                      ? 'border-2 border-slate-900 shadow-2xl scale-105'
                      : 'border border-slate-200 shadow-sm'
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-3">
                    {plan.name}
                  </h3>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      ₹{plan.price_inr}
                    </span>
                    <span className="text-slate-500">
                      /{plan.billing_cycle}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm text-slate-600">
                    {features.map((text) => (
                      <li
                        key={text}
                        className="flex items-start gap-2"
                      >
                        <Check className="w-4 h-4 text-green-600 mt-0.5" />
                        {text}
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup">
                    <Button
                      className="w-full"
                      variant={
                        plan.is_popular
                          ? 'default'
                          : 'outline'
                      }
                    >
                      Get Started
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t py-8 text-center text-slate-600">
        &copy; 2024 QR Menu. All rights reserved.
      </footer>
    </div>
  );
}

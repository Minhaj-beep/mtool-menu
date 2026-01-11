'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import {
  Check,
  Crown,
  Sparkles,
  ArrowUpRight,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

type BillingCycle = 'monthly' | 'yearly';

type SubscriptionPlan = {
  id: string;
  code: 'free' | 'basic' | 'pro' | 'enterprise';
  name: string;
  billing_cycle: BillingCycle;
  price_inr: number;
  is_popular: boolean;
  features: Record<string, any>;
};

const PLAN_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

const FEATURE_LABELS: Record<
  string,
  (value: any) => string | null
> = {
  watermark: (v) =>
    v ? 'Platform watermark' : 'No watermark',
  photos: (v) =>
    v > 0 ? `Dish photos (${v} images)` : null,
  google_review: (v) =>
    v ? 'Google review button' : null,
  analytics: (v) =>
    v ? 'Menu analytics' : null,
  branding: (v) =>
    v ? 'Custom branding' : null,
  white_label: (v) =>
    v ? 'White-label menu' : null,
  custom_domain: (v) =>
    v ? 'Custom domain' : null,
  dedicated_support: (v) =>
    v ? 'Dedicated support' : null,
};

export default function SubscriptionPage() {
  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);
  const [plans, setPlans] =
    useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (!user) return;

      const { data: restaurantData } =
        await supabaseBrowser
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .single();

      const { data: planData } =
        await supabaseBrowser
          .from('subscription_plans')
          .select('*')
          .order('price_inr');

      setRestaurant(restaurantData);
      setPlans(planData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Upgrade handler
  const handleUpgrade = async (plan: SubscriptionPlan) => {
    try {
      const resp = await fetch(
        '/api/razorpay/create-order',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: plan.id }),
        }
      );

      const data = await resp.json();
      if (!resp.ok || !data.orderId) {
        throw new Error(
          data.error || 'Failed to create order'
        );
      }

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve) => {
          const s = document.createElement('script');
          s.src =
            'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          document.head.appendChild(s);
        });
      }

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'QR Menu',
        description: `Upgrade to ${plan.name}`,
        order_id: data.orderId,
        handler: async (response: any) => {
          const verifyResp = await fetch(
            '/api/razorpay/verify',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...response,
                plan_id: plan.id,
                mode: 'upgrade',
              }),
            }
          );

          const verifyJson = await verifyResp.json();
          if (verifyJson.ok) {
            toast.success(
              'Subscription upgraded successfully'
            );
            loadData();
          } else {
            toast.error(
              verifyJson.error ||
                'Payment verification failed'
            );
          }
        },
        theme: { color: '#0f172a' },
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExtend = async (plan: SubscriptionPlan) => {
    try {
      const resp = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          mode: 'extend',
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to create order');
      }

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          document.head.appendChild(s);
        });
      }

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'QR Menu',
        description: `Extend ${plan.name} plan`,
        order_id: data.orderId,
        handler: async (response: any) => {
          const verifyResp = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              plan_id: plan.id,
              mode: 'extend',
            }),
          });

          const verifyJson = await verifyResp.json();
          if (verifyJson.ok) {
            toast.success('Subscription extended successfully');
            loadData();
          } else {
            toast.error(verifyJson.error || 'Verification failed');
          }
        },
        theme: { color: '#0f172a' },
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  const visiblePlans = plans.filter(
    (p) => p.billing_cycle === billingCycle
  );

  const currentRank = restaurant
    ? PLAN_RANK[restaurant.subscription_plan]
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Subscription
        </h1>
        <p className="text-slate-500 mt-1">
          Upgrade anytime. Downgrades are handled by
          support.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={
            billingCycle === 'monthly'
              ? 'default'
              : 'outline'
          }
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </Button>
        <Button
          size="sm"
          variant={
            billingCycle === 'yearly'
              ? 'default'
              : 'outline'
          }
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly
        </Button>
      </div>

      {/* Current Plan Card */}
      {restaurant && (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  Current Plan
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {restaurant.name}
                </CardDescription>
              </div>
              <Badge className="text-lg px-4 py-2">
                <Crown className="w-4 h-4 mr-1" />
                {restaurant.subscription_plan.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visiblePlans.map((plan) => {
          const targetRank =
            PLAN_RANK[plan.code];
          const isCurrent =
            restaurant?.subscription_plan ===
              plan.code &&
            restaurant?.subscription_cycle ===
              plan.billing_cycle;

          const isUpgrade =
            targetRank > currentRank;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.is_popular
                  ? 'border-2 border-slate-900'
                  : ''
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-slate-900">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {plan.billing_cycle}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    ₹{plan.price_inr}
                  </span>
                  {plan.price_inr > 0 && (
                    <span className="text-slate-500">
                      /{plan.billing_cycle}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {Object.entries(plan.features)
                    .map(([key, value]) => {
                      const formatter =
                        FEATURE_LABELS[key];
                      if (!formatter) return null;

                      const label =
                        formatter(value);
                      if (!label) return null;

                      return (
                        <li
                          key={key}
                          className="flex gap-2"
                        >
                          <Check className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>{label}</span>
                        </li>
                      );
                    })}
                </ul>

                {/* Action */}
                {isCurrent ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleExtend(plan)}
                  >
                    Extend Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleUpgrade(plan)
                    }
                  >
                    Upgrade
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.location.href =
                        'mailto:support@yourapp.com'
                    }
                  >
                    Contact Support
                    <Mail className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

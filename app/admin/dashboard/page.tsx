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
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import {
  FolderOpen,
  Utensils,
  Crown,
  Image as ImageIcon,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { PLAN_LIMITS } from '@/lib/subscription/plans';
import { format } from 'date-fns';

type Stats = {
  totalCategories: number;
  totalDishes: number;
};

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCategories: 0,
    totalDishes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1️⃣ Auth user
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // 2️⃣ Restaurant owned by user
      const { data: restaurantData, error: restaurantError } =
        await supabaseBrowser
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

      if (restaurantError || !restaurantData) {
        throw new Error('Restaurant not found');
      }

      setRestaurant(restaurantData);

      // 3️⃣ Categories count
      const { data: categoriesData, error: categoriesError } =
        await supabaseBrowser
          .from('menu_categories')
          .select('id')
          .eq('restaurant_id', restaurantData.id);

      if (categoriesError) throw categoriesError;

      // 4️⃣ Dishes count (JOIN via categories)
      const { data: dishesData, error: dishesError } =
        await supabaseBrowser
          .from('dishes')
          .select('id, menu_categories!inner(restaurant_id)')
          .eq('menu_categories.restaurant_id', restaurantData.id);

      if (dishesError) throw dishesError;

      setStats({
        totalCategories: categoriesData.length,
        totalDishes: dishesData.length,
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Guard states (IMPORTANT)
     ========================= */

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No restaurant found.
      </div>
    );
  }

  /* =========================
     Safe usage below
     ========================= */

  const planLimits = PLAN_LIMITS[restaurant.subscription_plan];

  const getUsagePercentage = (current: number, max: number | null) => {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back! Here's an overview of your restaurant.
        </p>
      </div>

      {/* Restaurant Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{restaurant.name}</CardTitle>
              <CardDescription>/{restaurant.slug}</CardDescription>
            </div>
            <Badge
              variant={
                restaurant.subscription_plan === 'free'
                  ? 'secondary'
                  : 'default'
              }
            >
              <Crown className="w-3 h-3 mr-1" />
              {restaurant.subscription_plan.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <StatCard
          title="Categories"
          icon={<FolderOpen className="h-4 w-4 text-muted-foreground" />}
          value={stats.totalCategories}
          max={planLimits.maxCategories}
          getUsagePercentage={getUsagePercentage}
          getStatusColor={getStatusColor}
        />

        {/* Dishes */}
        <StatCard
          title="Dishes"
          icon={<Utensils className="h-4 w-4 text-muted-foreground" />}
          value={stats.totalDishes}
          max={planLimits.maxDishes}
          getUsagePercentage={getUsagePercentage}
          getStatusColor={getStatusColor}
        />

        {/* Images */}
        <StatCard
          title="Image Storage"
          icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
          value={restaurant.image_count ?? 0}
          max={planLimits.maxImages}
          getUsagePercentage={getUsagePercentage}
          getStatusColor={getStatusColor}
          unavailable={!planLimits.allowImages}
        />

        {/* Subscription */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {restaurant.subscription_plan}
            </div>

            {restaurant.subscription_status && (
              <Badge className="mt-2 text-xs">
                {restaurant.subscription_status}
              </Badge>
            )}

            {restaurant.subscription_expires_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                Expires{' '}
                {format(
                  new Date(restaurant.subscription_expires_at),
                  'MMM dd, yyyy'
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA */}
      {restaurant.subscription_plan === 'free' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">
              Upgrade Your Plan
            </CardTitle>
            <CardDescription className="text-amber-700">
              Upgrade to unlock image uploads, more categories, and more dishes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

/* =========================
   Reusable Stat Card
   ========================= */

function StatCard({
  title,
  icon,
  value,
  max,
  unavailable,
  getUsagePercentage,
  getStatusColor,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  max: number | null;
  unavailable?: boolean;
  getUsagePercentage: (current: number, max: number | null) => number;
  getStatusColor: (percentage: number) => string;
}) {
  if (unavailable) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <p className="text-xs text-amber-600 font-medium">
            Not available on this plan
          </p>
        </CardContent>
      </Card>
    );
  }

  const percentage = getUsagePercentage(value, max);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {max ? (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p
              className={`text-xs font-medium ${getStatusColor(percentage)}`}
            >
              {value} of {max} used
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">Unlimited</p>
        )}
      </CardContent>
    </Card>
  );
}

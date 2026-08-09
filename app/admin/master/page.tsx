'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldAlert, ExternalLink, Search, Store, Image as ImageIcon, UtensilsCrossed } from 'lucide-react';

type MasterRestaurant = {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_cycle: string;
  subscription_expires_at: string | null;
  is_on_hold: boolean | null;
  image_count: number;
  owner_email: string | null;
  category_count: number;
  dish_count: number;
  created_at: string;
};

export default function MasterAdminPage() {
  const [state, setState] = useState<'checking' | 'denied' | 'ready'>('checking');
  const [restaurants, setRestaurants] = useState<MasterRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        setState('denied');
        return;
      }

      const res = await fetch('/api/master/restaurants');

      if (res.status === 403 || res.status === 401) {
        setState('denied');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load');
      }

      setRestaurants(data.restaurants ?? []);
      setState('ready');
    } catch (err) {
      console.error(err);
      setState('denied');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.slug.toLowerCase().includes(search.toLowerCase()) ||
        (r.owner_email ?? '').toLowerCase().includes(search.toLowerCase());

      const matchesPlan = planFilter === 'all' || r.subscription_plan === planFilter;
      const matchesStatus = statusFilter === 'all' || r.subscription_status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [restaurants, search, planFilter, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: restaurants.length,
      active: restaurants.filter((r) => r.subscription_status === 'active').length,
      expired: restaurants.filter((r) => r.subscription_status === 'expired').length,
      onHold: restaurants.filter((r) => r.is_on_hold).length,
      totalDishes: restaurants.reduce((sum, r) => sum + (r.dish_count || 0), 0),
      totalImages: restaurants.reduce((sum, r) => sum + (r.image_count || 0), 0),
    };
  }, [restaurants]);

  if (state === 'checking' || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" />
          <p className="text-sm text-slate-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Access denied</h2>
            <p className="text-sm text-slate-500">
              This page is restricted to master admins. If you believe you should
              have access, ask an existing super admin to grant your account the
              <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs">super_admin</code>
              role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Admin</h1>
        <p className="text-sm text-slate-500 mt-1">
          All restaurants on the platform — private, super-admin only.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary.active} active · {summary.expired} expired
              {summary.onHold ? ` · ${summary.onHold} on hold` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5" /> Dishes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{summary.totalDishes}</p>
            <p className="text-xs text-slate-500 mt-0.5">across all restaurants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{summary.totalImages}</p>
            <p className="text-xs text-slate-500 mt-0.5">uploaded to S3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">Free plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {restaurants.filter((r) => r.subscription_plan === 'free').length}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">of {summary.total} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, slug, or owner email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Dishes</TableHead>
                <TableHead className="text-right">Images</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">/{r.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {r.owner_email ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {r.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        variant={
                          r.subscription_status === 'active'
                            ? 'default'
                            : r.subscription_status === 'expired'
                              ? 'destructive'
                              : 'outline'
                        }
                        className="capitalize"
                      >
                        {r.subscription_status}
                      </Badge>
                      {r.is_on_hold && (
                        <Badge variant="destructive" className="text-[10px]">
                          On hold
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {r.subscription_expires_at
                      ? new Date(r.subscription_expires_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600">
                    {r.dish_count}
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600">
                    {r.image_count}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/menu/${r.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-slate-700 inline-flex"
                      aria-label={`View ${r.name}'s public menu`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-slate-500 py-8">
                    No restaurants match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

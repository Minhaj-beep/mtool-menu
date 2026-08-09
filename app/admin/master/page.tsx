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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ShieldAlert,
  ExternalLink,
  Search,
  Store,
  Image as ImageIcon,
  UtensilsCrossed,
  Globe,
  Pencil,
} from 'lucide-react';

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
  custom_domain: string | null;
};

export default function MasterAdminPage() {
  const [state, setState] = useState<'checking' | 'denied' | 'ready'>('checking');
  const [restaurants, setRestaurants] = useState<MasterRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Custom domain edit dialog
  const [domainDialogRestaurant, setDomainDialogRestaurant] = useState<MasterRestaurant | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);

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
        (r.owner_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.custom_domain ?? '').toLowerCase().includes(search.toLowerCase());

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

  const openDomainDialog = (r: MasterRestaurant) => {
    setDomainDialogRestaurant(r);
    setDomainInput(r.custom_domain ?? '');
  };

  const saveDomain = async () => {
    if (!domainDialogRestaurant) return;

    try {
      setSavingDomain(true);

      const res = await fetch(
        `/api/master/restaurants/${domainDialogRestaurant.id}/domain`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: domainInput.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save domain');

      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === domainDialogRestaurant.id
            ? { ...r, custom_domain: data.custom_domain }
            : r
        )
      );

      toast.success(
        data.custom_domain ? `Domain set to ${data.custom_domain}` : 'Domain removed'
      );
      setDomainDialogRestaurant(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save domain');
    } finally {
      setSavingDomain(false);
    }
  };

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
                <TableHead>Domain</TableHead>
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
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => openDomainDialog(r)}
                      className="group inline-flex items-center gap-1.5 text-sm"
                    >
                      {r.custom_domain ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <Globe className="w-3.5 h-3.5 text-emerald-600" />
                          {r.custom_domain}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not set</span>
                      )}
                      <Pencil className="w-3 h-3 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </button>
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
                  <TableCell colSpan={10} className="text-center text-sm text-slate-500 py-8">
                    No restaurants match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Custom domain dialog */}
      <Dialog
        open={!!domainDialogRestaurant}
        onOpenChange={(open) => !open && setDomainDialogRestaurant(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom domain</DialogTitle>
            <DialogDescription>
              {domainDialogRestaurant?.name} — set the domain visitors will use
              to reach their menu, e.g. <code>thefifthcafe.com</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="thefifthcafe.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
            />

            <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-3 space-y-1.5">
              <p className="font-medium text-slate-700">Before saving this, make sure:</p>
              <p>1. The domain has been added under Vercel → Project → Domains.</p>
              <p>
                2. Its DNS has an A record pointing at the IP Vercel showed you (or a
                CNAME to <code>cname.vercel-dns.com</code> if it's a subdomain).
              </p>
              <p>
                3. Vercel shows <span className="font-medium">"Valid Configuration"</span> for it.
              </p>
              <p className="pt-1">
                Saving this here is the last step — it tells the app which restaurant
                to show when that domain is visited. Leave it blank to remove a
                domain mapping.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDomainDialogRestaurant(null)}
              disabled={savingDomain}
            >
              Cancel
            </Button>
            <Button onClick={saveDomain} disabled={savingDomain}>
              {savingDomain ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

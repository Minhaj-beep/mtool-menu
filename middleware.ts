import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Domains that are ours, not a client's — never treat these as a
// custom domain lookup.
const PLATFORM_HOSTS = new Set([
  'menu.mtoool.work',
  'mtoool.work',
  'www.mtoool.work',
  'localhost:3000',
]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type RestaurantLookup = {
  slug: string;
  subscription_status: string;
  is_on_hold: boolean;
};

// Plain fetch straight to Supabase's PostgREST endpoint instead of the
// @supabase/supabase-js client. The JS client pulls in some Node-only
// internals (e.g. through realtime-js) that aren't guaranteed to work
// in Vercel's Edge Runtime, where middleware always executes — a
// failure there can make the whole lookup silently no-op instead of
// erroring loudly, which is indistinguishable from "no custom domain
// found" unless you go looking. A bare fetch has no such baggage.
async function findRestaurantByDomain(
  hostname: string
): Promise<{ restaurant: RestaurantLookup | null; debug: string }> {
  const url =
    `${SUPABASE_URL}/rest/v1/restaurants` +
    `?select=slug,subscription_status,is_on_hold,custom_domain` +
    `&custom_domain=eq.${encodeURIComponent(hostname)}` +
    `&limit=1`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    // Custom domains change rarely; a short edge cache keeps this from
    // hitting the DB on every single request without going stale for long.
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    // Surface the *real* reason (bad column, RLS/permission issue, bad
    // request, etc.) instead of silently treating every failure as
    // "no matching restaurant" — those are very different problems.
    const body = await res.text();
    return { restaurant: null, debug: `http-${res.status}:${body.slice(0, 200)}` };
  }

  const rows: RestaurantLookup[] = await res.json();
  return { restaurant: rows[0] ?? null, debug: rows.length === 0 ? 'no-row' : 'ok' };
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() ?? '';
  const hostname = host.split(':')[0]; // strip port for local dev

  // Fast path: our own domain, or an unmapped host — do nothing.
  if (PLATFORM_HOSTS.has(host) || PLATFORM_HOSTS.has(hostname)) {
    return NextResponse.next();
  }

  // Don't intercept Next internals, static assets, or API routes —
  // only real page requests need the custom-domain lookup.
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // e.g. /favicon.ico, /banner.png
  ) {
    return NextResponse.next();
  }

  let restaurant: RestaurantLookup | null = null;
  let debug = '';

  try {
    const result = await findRestaurantByDomain(hostname);
    restaurant = result.restaurant;
    debug = result.debug;
  } catch (err) {
    debug = `throw:${err instanceof Error ? err.message : 'unknown error'}`;
  }

  // Unknown domain (or the lookup itself failed) — let it fall through
  // rather than silently rewriting to nothing. The debug header lets
  // you tell these cases apart from outside with curl -I.
  if (!restaurant) {
    const res = NextResponse.next();
    res.headers.set('x-custom-domain-lookup', debug || 'not-found');
    return res;
  }

  // Suspended/inactive restaurant — still rewrite so the existing
  // "unavailable" screen (already built into /menu/[slug]) shows up,
  // instead of a confusing generic 404 on their own domain.
  const url = request.nextUrl.clone();
  url.pathname = `/menu/${restaurant.slug}${pathname === '/' ? '' : pathname}`;

  const res = NextResponse.rewrite(url);
  res.headers.set('x-custom-domain-lookup', `matched:${restaurant.slug}`);
  return res;
}

export const config = {
  // Run on every request except static files handled by the checks
  // above (kept broad here; the pathname checks inside do the real
  // filtering so this stays correct even if new static paths appear).
  matcher: ['/((?!_next/static|_next/image).*)'],
};

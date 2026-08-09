import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Domains that are ours, not a client's — never treat these as a
// custom domain lookup.
const PLATFORM_HOSTS = new Set([
  'menu.mtoool.work',
  'mtoool.work',
  'www.mtoool.work',
  'localhost:3000',
]);

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('slug, subscription_status, is_on_hold')
    .eq('custom_domain', hostname)
    .maybeSingle();

  // Unknown domain — let it fall through to the normal not-found page
  // rather than silently rewriting to nothing.
  if (!restaurant) {
    return NextResponse.next();
  }

  // Suspended/inactive restaurant — still rewrite so the existing
  // "unavailable" screen (already built into /menu/[slug]) shows up,
  // instead of a confusing generic 404 on their own domain.
  const url = request.nextUrl.clone();
  url.pathname = `/menu/${restaurant.slug}${pathname === '/' ? '' : pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  // Run on every request except static files handled by the checks
  // above (kept broad here; the pathname checks inside do the real
  // filtering so this stays correct even if new static paths appear).
  matcher: ['/((?!_next/static|_next/image).*)'],
};

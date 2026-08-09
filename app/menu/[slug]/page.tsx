import type { Metadata } from 'next';
import { getSupabaseServer } from '@/lib/supabase/server';
import MenuClient from './MenuClient';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mtoool.menu';

async function getRestaurantForMeta(slug: string) {
  const supabase = getSupabaseServer();

  // Public read — the `restaurants` table already has an RLS policy
  // allowing anon SELECT for menu display, so this works without a
  // service-role key.
  const { data } = await supabase
    .from('restaurants')
    .select(
      'name, slug, address, city, country, logo_url, banner_image_url, theme_color, subscription_status, is_on_hold, custom_domain'
    )
    .eq('slug', slug)
    .maybeSingle();

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const restaurant = await getRestaurantForMeta(params.slug);

  if (!restaurant) {
    return {
      title: 'Menu not found',
      description: 'This restaurant menu could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const location = [restaurant.city, restaurant.country].filter(Boolean).join(', ');
  const title = `${restaurant.name} - Menu${location ? ` | ${location}` : ''}`;
  const description = `Browse the digital menu for ${restaurant.name}${
    location ? ` in ${location}` : ''
  }. View dishes, prices, and photos, and find your way to visit us.`;

  // Prefer their banner (wider, better for social preview cards), then
  // logo, then fall back to the platform default set in the root layout.
  const shareImage = restaurant.banner_image_url || restaurant.logo_url;

  // If this restaurant has a live custom domain, that's the canonical,
  // shareable URL — not the menu.mtoool.work path — so search engines
  // and social previews point at the branded domain instead.
  const canonicalUrl = restaurant.custom_domain
    ? `https://${restaurant.custom_domain}`
    : `${APP_URL}/menu/${restaurant.slug}`;

  const isUnavailable =
    restaurant.is_on_hold || restaurant.subscription_status !== 'active';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isUnavailable
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: `${restaurant.name} · mtoool menu`,
      type: 'website',
      ...(shareImage ? { images: [{ url: shareImage, width: 1200, height: 630, alt: restaurant.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}

export default async function PublicMenuPage({
  params,
}: {
  params: { slug: string };
}) {
  const restaurant = await getRestaurantForMeta(params.slug);

  const canonicalUrl = restaurant?.custom_domain
    ? `https://${restaurant.custom_domain}`
    : restaurant
      ? `${APP_URL}/menu/${restaurant.slug}`
      : undefined;

  const jsonLd = restaurant
    ? {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: restaurant.name,
        image: restaurant.banner_image_url || restaurant.logo_url || undefined,
        url: canonicalUrl,
        ...(restaurant.address
          ? {
              address: {
                '@type': 'PostalAddress',
                streetAddress: restaurant.address,
                addressLocality: restaurant.city || undefined,
                addressCountry: restaurant.country || undefined,
              },
            }
          : {}),
        hasMenu: canonicalUrl,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MenuClient slug={params.slug} />
    </>
  );
}

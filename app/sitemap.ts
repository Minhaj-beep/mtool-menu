import type { MetadataRoute } from 'next';
import { getSupabaseServer } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mtoool.menu';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseServer();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('slug, custom_domain, updated_at, subscription_status, is_on_hold')
    .eq('subscription_status', 'active');

  const restaurantEntries: MetadataRoute.Sitemap = (restaurants ?? [])
    .filter((r) => !r.is_on_hold)
    .map((r) => ({
      url: r.custom_domain ? `https://${r.custom_domain}` : `${APP_URL}/menu/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : undefined,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  return [
    {
      url: APP_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...restaurantEntries,
  ];
}

import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mtoool.menu';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/login', '/signup', '/reset-password', '/forgot-password'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}

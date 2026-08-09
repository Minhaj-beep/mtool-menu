/*
  # Custom domains for restaurants

  ## Overview
  Lets a restaurant use their own domain (e.g. thefifthcafe.com) to serve
  their existing menu page (menu.mtoool.work/menu/the-5ifth-cafe-and-restro)
  without changing the URL shown in the visitor's browser.

  ## Changes
  - Adds `custom_domain` (text, nullable, unique) to `restaurants`. Stored
    as a bare hostname, lowercase, no protocol/path — e.g.
    `thefifthcafe.com`, not `https://thefifthcafe.com/`.
  - Adds a unique index so two restaurants can never claim the same domain.

  ## Notes
  - This column alone does nothing by itself. Three more things have to
    happen for a domain to actually work:
    1. The domain's DNS must point at Vercel (an A/CNAME record set by
       whoever manages that domain's DNS).
    2. The domain must be added to the Vercel project (Vercel dashboard →
       Domains → Add Existing), so Vercel accepts traffic for it and
       issues an SSL certificate.
    3. This `custom_domain` column must be set to that same hostname, so
       the app's middleware knows which restaurant to serve when it sees
       that Host header.
  - `restaurants` already has a public SELECT policy for anon (used to
    display menus), which the middleware relies on to look up
    custom_domain → slug without needing the service-role key.
*/

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_domain text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_custom_domain
  ON public.restaurants (custom_domain)
  WHERE custom_domain IS NOT NULL;

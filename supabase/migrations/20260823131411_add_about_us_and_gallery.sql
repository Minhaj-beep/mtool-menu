-- Add "About Us" and "Gallery" support to restaurants
-- About Us: a free-text blurb shown on the public menu page
-- Gallery: an ordered list of image objects { url, key, caption? } stored as jsonb,
--          available on every subscription plan (not gated by plan limits).

alter table restaurants
  add column if not exists about_us text,
  add column if not exists show_about_us boolean not null default true,
  add column if not exists gallery_images jsonb not null default '[]'::jsonb;

comment on column restaurants.about_us is 'Free-text "About Us" content shown on the public menu page.';
comment on column restaurants.show_about_us is 'Whether the About Us section is visible on the public menu page.';
comment on column restaurants.gallery_images is 'Array of { url, key, caption? } objects for the restaurant photo gallery. Not plan-gated.';

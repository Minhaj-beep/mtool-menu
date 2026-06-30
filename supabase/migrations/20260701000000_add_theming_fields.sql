/*
  # Add Full Theming & Branding Fields to Restaurants

  ## Overview
  The admin settings UI (app/admin/settings/page.tsx) already collects
  secondary_theme_color, font_family, banner_image_url, background_image_url,
  button_style, card_style, menu_layout, dark_mode and theme_preset, but several
  of these columns were never added to the database. Saves involving these
  fields would silently fail (PostgREST "column does not exist" error).

  This migration is idempotent (IF NOT EXISTS) so it is safe to run regardless
  of which fields already exist in a given environment.

  ## New Columns
    - `secondary_theme_color` (text) - accent color used alongside theme_color
    - `font_family` (text) - one of: Inter, Poppins, Roboto, Montserrat, Open Sans, Lato, Nunito, Playfair Display
    - `banner_image_url` (text) - hero banner image for the public menu
    - `background_image_url` (text) - page background image for the public menu
    - `button_style` (text) - one of: rounded, pill, square
    - `card_style` (text) - one of: shadow, flat, outlined, glass
    - `menu_layout` (text) - one of: grid, list, compact
    - `dark_mode` (boolean) - force dark presentation regardless of preset
    - `theme_preset` (text) - one of: minimal, modern, luxury, coffee, elegant, dark, custom

  ## Notes
    - All columns are nullable / have safe defaults so existing restaurants
      keep working with the legacy single-color look until they opt in.
    - No existing columns, RLS policies, or data are modified.
*/

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS secondary_theme_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS banner_image_url text,
  ADD COLUMN IF NOT EXISTS background_image_url text,
  ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'shadow',
  ADD COLUMN IF NOT EXISTS menu_layout text DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_preset text DEFAULT 'custom';

-- Guardrails so bad values from older clients can't silently break the theme engine
ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS restaurants_button_style_check,
  ADD CONSTRAINT restaurants_button_style_check
    CHECK (button_style IN ('rounded', 'pill', 'square'));

ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS restaurants_card_style_check,
  ADD CONSTRAINT restaurants_card_style_check
    CHECK (card_style IN ('shadow', 'flat', 'outlined', 'glass'));

ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS restaurants_menu_layout_check,
  ADD CONSTRAINT restaurants_menu_layout_check
    CHECK (menu_layout IN ('grid', 'list', 'compact'));

ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS restaurants_theme_preset_check,
  ADD CONSTRAINT restaurants_theme_preset_check
    CHECK (theme_preset IN ('minimal', 'modern', 'luxury', 'coffee', 'elegant', 'dark', 'custom'));

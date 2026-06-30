import type { CSSProperties } from 'react';
import type { Restaurant, ThemePreset } from '@/lib/types/database';
import { getReadableTextColor, hexToRgba, shade } from './color-utils';
import { resolveFont } from './fonts';

export type Elevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type Spacing = 'compact' | 'comfortable' | 'spacious';
export type HeroStyle = 'immersive' | 'gradient' | 'minimal';
export type AnimationIntensity = 'subtle' | 'normal';

export interface RestaurantTheme {
  preset: ThemePreset;
  isDark: boolean;

  colors: {
    primary: string;
    primaryText: string; // readable text/icon color on top of `primary`
    secondary: string;
    secondaryText: string;
    background: string;
    surface: string;
    surfaceMuted: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };

  radius: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };

  shadow: Record<Elevation, string>;
  spacing: Spacing;
  hero: HeroStyle;
  animation: AnimationIntensity;

  font: { className: string; family: string };

  // Pass-through explicit choices — these are *not* overridden by presets,
  // since they're things the restaurant owner picked deliberately.
  buttonStyle: 'rounded' | 'pill' | 'square';
  cardStyle: 'shadow' | 'flat' | 'outlined' | 'glass';
  layout: 'grid' | 'list' | 'compact';

  bannerImageUrl: string | null;
  backgroundImageUrl: string | null;

  // Precomputed so components never have to re-derive radius from buttonStyle
  buttonRadius: string;
  cardRadius: string;
}

// Each preset controls the *atmosphere* of the menu — radius, shadow depth,
// spacing rhythm, hero immersiveness and animation energy. Explicit
// owner-chosen fields (button_style, card_style, menu_layout, font_family,
// theme_color, dark_mode) always come straight from the database row so a
// restaurant's deliberate choices are never silently overridden by a preset.
const PRESET_ATMOSPHERE: Record<
  ThemePreset,
  {
    radiusScale: 'sharp' | 'soft' | 'round';
    elevation: 'flat' | 'soft' | 'deep';
    spacing: Spacing;
    hero: HeroStyle;
    animation: AnimationIntensity;
    forceDark: boolean;
    fallbackPrimary: string;
  }
> = {
  minimal: {
    radiusScale: 'sharp',
    elevation: 'flat',
    spacing: 'spacious',
    hero: 'minimal',
    animation: 'subtle',
    forceDark: false,
    fallbackPrimary: '#111111',
  },
  modern: {
    radiusScale: 'soft',
    elevation: 'soft',
    spacing: 'comfortable',
    hero: 'gradient',
    animation: 'normal',
    forceDark: false,
    fallbackPrimary: '#6366f1',
  },
  luxury: {
    radiusScale: 'sharp',
    elevation: 'deep',
    spacing: 'spacious',
    hero: 'immersive',
    animation: 'subtle',
    forceDark: true,
    fallbackPrimary: '#c9a24b',
  },
  coffee: {
    radiusScale: 'round',
    elevation: 'soft',
    spacing: 'comfortable',
    hero: 'immersive',
    animation: 'subtle',
    forceDark: false,
    fallbackPrimary: '#6f4e37',
  },
  elegant: {
    radiusScale: 'soft',
    elevation: 'soft',
    spacing: 'spacious',
    hero: 'gradient',
    animation: 'subtle',
    forceDark: false,
    fallbackPrimary: '#9d174d',
  },
  dark: {
    radiusScale: 'round',
    elevation: 'deep',
    spacing: 'comfortable',
    hero: 'immersive',
    animation: 'normal',
    forceDark: true,
    fallbackPrimary: '#22d3ee',
  },
  custom: {
    radiusScale: 'soft',
    elevation: 'soft',
    spacing: 'comfortable',
    hero: 'gradient',
    animation: 'normal',
    forceDark: false,
    fallbackPrimary: '#6366f1',
  },
};

const RADIUS_SCALES: Record<'sharp' | 'soft' | 'round', RestaurantTheme['radius']> = {
  sharp: { sm: '4px', md: '6px', lg: '10px', pill: '9999px' },
  soft: { sm: '8px', md: '14px', lg: '20px', pill: '9999px' },
  round: { sm: '12px', md: '20px', lg: '28px', pill: '9999px' },
};

function buildShadowScale(elevation: 'flat' | 'soft' | 'deep'): Record<Elevation, string> {
  if (elevation === 'flat') {
    return {
      none: 'none',
      sm: 'none',
      md: '0 1px 2px rgba(15, 23, 42, 0.06)',
      lg: '0 1px 3px rgba(15, 23, 42, 0.08)',
      xl: '0 2px 6px rgba(15, 23, 42, 0.1)',
    };
  }
  if (elevation === 'deep') {
    return {
      none: 'none',
      sm: '0 2px 8px rgba(0, 0, 0, 0.18)',
      md: '0 8px 24px rgba(0, 0, 0, 0.22)',
      lg: '0 16px 40px rgba(0, 0, 0, 0.28)',
      xl: '0 24px 64px rgba(0, 0, 0, 0.35)',
    };
  }
  return {
    none: 'none',
    sm: '0 1px 3px rgba(15, 23, 42, 0.08)',
    md: '0 4px 12px rgba(15, 23, 42, 0.08)',
    lg: '0 10px 30px rgba(15, 23, 42, 0.12)',
    xl: '0 20px 48px rgba(15, 23, 42, 0.16)',
  };
}

export function buildTheme(restaurant: Restaurant): RestaurantTheme {
  const preset: ThemePreset = restaurant.theme_preset ?? 'custom';
  const atmosphere = PRESET_ATMOSPHERE[preset] ?? PRESET_ATMOSPHERE.custom;

  const isDark = restaurant.dark_mode ?? atmosphere.forceDark;

  const primary = restaurant.theme_color || atmosphere.fallbackPrimary;
  const secondary = restaurant.secondary_theme_color || shade(primary, isDark ? 0.25 : -0.15);

  const background = isDark ? '#0b0b0f' : '#fafafa';
  const surface = isDark ? '#15151b' : '#ffffff';
  const surfaceMuted = isDark ? hexToRgba('#ffffff', 0.04) : '#f1f5f9';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#a1a1aa' : '#475569';
  const border = isDark ? hexToRgba('#ffffff', 0.08) : '#e2e8f0';

  const radius = RADIUS_SCALES[atmosphere.radiusScale];
  const buttonStyle = restaurant.button_style ?? 'rounded';
  const buttonRadius =
    buttonStyle === 'pill' ? radius.pill : buttonStyle === 'square' ? '4px' : radius.md;
  const cardRadius = restaurant.card_style === 'flat' ? radius.sm : radius.lg;

  return {
    preset,
    isDark,
    colors: {
      primary,
      primaryText: getReadableTextColor(primary),
      secondary,
      secondaryText: getReadableTextColor(secondary),
      background,
      surface,
      surfaceMuted,
      textPrimary,
      textSecondary,
      border,
    },
    radius,
    shadow: buildShadowScale(atmosphere.elevation),
    spacing: atmosphere.spacing,
    hero: atmosphere.hero,
    animation: atmosphere.animation,
    font: resolveFont(restaurant.font_family),
    buttonStyle,
    cardStyle: restaurant.card_style ?? 'shadow',
    layout: restaurant.menu_layout ?? 'grid',
    bannerImageUrl: restaurant.banner_image_url ?? null,
    backgroundImageUrl: restaurant.background_image_url ?? null,
    buttonRadius,
    cardRadius,
  };
}

// Convenience CSS custom properties so components/CSS can read the theme
// without prop-drilling every single value.
export function themeToCssVars(theme: RestaurantTheme): CSSProperties {
  return {
    ['--rt-primary' as string]: theme.colors.primary,
    ['--rt-primary-text' as string]: theme.colors.primaryText,
    ['--rt-secondary' as string]: theme.colors.secondary,
    ['--rt-secondary-text' as string]: theme.colors.secondaryText,
    ['--rt-background' as string]: theme.colors.background,
    ['--rt-surface' as string]: theme.colors.surface,
    ['--rt-surface-muted' as string]: theme.colors.surfaceMuted,
    ['--rt-text-primary' as string]: theme.colors.textPrimary,
    ['--rt-text-secondary' as string]: theme.colors.textSecondary,
    ['--rt-border' as string]: theme.colors.border,
    ['--rt-radius-sm' as string]: theme.radius.sm,
    ['--rt-radius-md' as string]: theme.radius.md,
    ['--rt-radius-lg' as string]: theme.radius.lg,
    ['--rt-radius-pill' as string]: theme.radius.pill,
    ['--rt-shadow-sm' as string]: theme.shadow.sm,
    ['--rt-shadow-md' as string]: theme.shadow.md,
    ['--rt-shadow-lg' as string]: theme.shadow.lg,
    ['--rt-shadow-xl' as string]: theme.shadow.xl,
    ['--rt-font' as string]: theme.font.family,
  } as CSSProperties;
}

export function getCardSurfaceStyle(theme: RestaurantTheme): CSSProperties {
  const base: CSSProperties = {
    borderRadius: theme.cardRadius,
    backgroundColor: theme.colors.surface,
  };

  switch (theme.cardStyle) {
    case 'flat':
      return { ...base, boxShadow: 'none', border: 'none' };
    case 'outlined':
      return { ...base, boxShadow: 'none', border: `1px solid ${theme.colors.border}` };
    case 'glass':
      return {
        ...base,
        backgroundColor: hexToRgba(theme.isDark ? '#ffffff' : '#ffffff', theme.isDark ? 0.06 : 0.55),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hexToRgba('#ffffff', theme.isDark ? 0.12 : 0.4)}`,
        boxShadow: theme.shadow.md,
      };
    case 'shadow':
    default:
      return { ...base, boxShadow: theme.shadow.md, border: `1px solid ${theme.colors.border}` };
  }
}

export { hexToRgba, shade, getReadableTextColor } from './color-utils';

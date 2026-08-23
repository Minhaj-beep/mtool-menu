import type { SocialLinks } from '@/lib/types/database';
import type { ComponentType } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Globe, MessageCircle } from 'lucide-react';

// Social icon mapping with fallback, shared by VisitUs and QuickContactDock.
export const SOCIAL_ICON_MAP: Record<string, ComponentType<{ className?: string; color?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  whatsapp: MessageCircle,
  website: Globe,
};

/** Turns a raw stored value (handle, number, or full URL) into a clickable URL. */
export function normalizeSocialUrl(platform: string, value: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (platform === 'whatsapp') {
    const digits = value.replace(/[^\d]/g, '');
    return `https://wa.me/${digits}`;
  }
  return `https://${value.replace(/^@/, '')}`;
}

export function getSocialEntries(socialLinks: SocialLinks | null | undefined): [string, string][] {
  return Object.entries(socialLinks ?? {}).filter(([, url]) => !!url) as [string, string][];
}

export function telHref(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, '')}`;
}

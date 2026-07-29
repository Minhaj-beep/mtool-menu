'use client';

import { Phone, Clock, MapPin, Facebook, Instagram, Twitter, Youtube, Globe, MessageCircle } from 'lucide-react';
import type { Restaurant } from '@/lib/types/database';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { formatOpeningHours, isRestaurantOpenNow } from '@/lib/utils/opening-hours';

const SOCIAL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  whatsapp: MessageCircle,
  website: Globe,
};

function normalizeSocialUrl(platform: string, value: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (platform === 'whatsapp') {
    const digits = value.replace(/[^\d]/g, '');
    return `https://wa.me/${digits}`;
  }
  return `https://${value.replace(/^@/, '')}`;
}

export function VisitUs({ restaurant, theme }: { restaurant: Restaurant; theme: RestaurantTheme }) {
  const contactNumbers = restaurant.show_contact_numbers ? restaurant.contact_numbers ?? [] : [];
  const socialLinks = restaurant.show_social_media ? restaurant.social_links ?? {} : {};
  const hoursLines = formatOpeningHours(restaurant.opening_hours);
  const openNow = isRestaurantOpenNow(restaurant.opening_hours);

  const socialEntries = Object.entries(socialLinks).filter(([, url]) => !!url);

  const hasContact = contactNumbers.length > 0;
  const hasHours = hoursLines.length > 0;
  const hasSocial = socialEntries.length > 0;

  if (!hasContact && !hasHours && !hasSocial) return null;

  const infoCards = [
    hasContact && {
      icon: Phone,
      label: contactNumbers.length > 1 ? 'Phone Numbers' : 'Phone',
      content: (
        <div className="space-y-1">
          {contactNumbers.map((num) => (
            <a
              key={num}
              href={`tel:${num.replace(/[^\d+]/g, '')}`}
              className="block text-sm font-medium hover:underline"
              style={{ color: theme.colors.textPrimary }}
            >
              {num}
            </a>
          ))}
        </div>
      ),
    },
    hasHours && {
      icon: Clock,
      label: 'Opening Hours',
      content: (
        <div className="space-y-1">
          {hoursLines.map((line) => (
            <p key={line} className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
              {line}
            </p>
          ))}
          {openNow !== null && (
            <span
              className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: openNow ? '#dcfce7' : '#fee2e2',
                color: openNow ? '#166534' : '#991b1b',
              }}
            >
              {openNow ? 'Open now' : 'Closed now'}
            </span>
          )}
        </div>
      ),
    },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; content: React.ReactNode }[];

  return (
    <div className="mt-12 md:mt-16">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5" style={{ color: theme.colors.primary }} />
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
          Visit Us
        </h2>
      </div>

      {infoCards.length > 0 && (
        <div
          className="grid gap-4 mb-4"
          style={{ gridTemplateColumns: `repeat(${Math.min(infoCards.length, 3)}, minmax(0, 1fr))` }}
        >
          {infoCards.map(({ icon: Icon, label, content }) => (
            <div
              key={label}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                boxShadow: theme.shadow.sm,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.textSecondary }}>
                  {label}
                </span>
              </div>
              {content}
            </div>
          ))}
        </div>
      )}

      {hasSocial && (
        <div className="flex flex-wrap items-center gap-3">
          {socialEntries.map(([platform, url]) => {
            const Icon = SOCIAL_ICON_MAP[platform] ?? Globe;
            return (
              <a
                key={platform}
                href={normalizeSocialUrl(platform, url as string)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.primary,
                }}
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

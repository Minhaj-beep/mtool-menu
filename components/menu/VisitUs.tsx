'use client';

import {
  Phone,
  Clock,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  MessageCircle,
} from 'lucide-react';
import type { Restaurant } from '@/lib/types/database';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { formatOpeningHours, isRestaurantOpenNow } from '@/lib/utils/opening-hours';

// Social icon mapping with fallback
const SOCIAL_ICON_MAP: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
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

  // Build formatted address
  const addressParts = [restaurant.address, restaurant.city, restaurant.country].filter(Boolean);
  const formattedAddress = addressParts.join(', ');

  const hasContact = contactNumbers.length > 0;
  const hasHours = hoursLines.length > 0;
  const hasAddress = formattedAddress.length > 0;
  const hasSocial = socialEntries.length > 0;

  if (!hasContact && !hasHours && !hasAddress && !hasSocial) return null;

  // Helper to render each info card
  const renderInfoCard = (
    Icon: React.ComponentType<{ className?: string; color?: string }>,
    label: string,
    content: React.ReactNode
  ) => (
    <div
      className="p-5 rounded-2xl border transition-shadow hover:shadow-md"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.sm,
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Icon className="w-5 h-5" color={theme.colors.textSecondary} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.colors.textSecondary }}
        >
          {label}
        </span>
      </div>
      <div className="space-y-1.5" style={{ color: theme.colors.textPrimary }}>
        {content}
      </div>
    </div>
  );

  const infoCards = [];

  if (hasAddress) {
    infoCards.push(
      renderInfoCard(
        MapPin,
        'Address',
        <p className="text-sm font-medium leading-relaxed">{formattedAddress}</p>
      )
    );
  }

  if (hasContact) {
    infoCards.push(
      renderInfoCard(
        Phone,
        contactNumbers.length > 1 ? 'Phone Numbers' : 'Phone',
        contactNumbers.map((num) => (
          <a
            key={num}
            href={`tel:${num.replace(/[^\d+]/g, '')}`}
            className="block text-sm font-medium hover:underline"
            style={{ color: theme.colors.textPrimary }}
          >
            {num}
          </a>
        ))
      )
    );
  }

  if (hasHours) {
    infoCards.push(
      renderInfoCard(
        Clock,
        'Opening Hours',
        <>
          {hoursLines.map((line) => (
            <p key={line} className="text-sm font-medium">{line}</p>
          ))}
          {openNow !== null && (
            <span
              className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: openNow ? '#dcfce7' : '#fee2e2',
                color: openNow ? '#166534' : '#991b1b',
              }}
            >
              {openNow ? '● Open now' : '● Closed now'}
            </span>
          )}
        </>
      )
    );
  }

  return (
    <div className="mt-12 md:mt-16">
      <div className="flex items-center gap-2.5 mb-5">
        <MapPin className="w-6 h-6" color={theme.colors.primary} />
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: theme.colors.textPrimary }}>
          Visit Us
        </h2>
      </div>

      {/* Info cards (Address, Contact, Hours) */}
      {infoCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {infoCards}
        </div>
      )}

      {/* Social links */}
      {hasSocial && (
        <div className="flex flex-wrap items-center gap-3.5 pt-1">
          <span
            className="text-sm font-medium uppercase tracking-wider mr-1"
            style={{ color: theme.colors.textSecondary }}
          >
            Follow us
          </span>
          {socialEntries.map(([platform, url]) => {
            const Icon = SOCIAL_ICON_MAP[platform] ?? Globe;
            return (
              <a
                key={platform}
                href={normalizeSocialUrl(platform, url as string)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-md"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.primary,
                }}
              >
                <Icon className="w-5 h-5" color={theme.colors.primary} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
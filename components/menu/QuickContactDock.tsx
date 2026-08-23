'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Share2, MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Restaurant } from '@/lib/types/database';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { hexToRgba } from '@/lib/theme/theme-engine';
import { normalizeSocialUrl, telHref, SOCIAL_ICON_MAP } from '@/lib/utils/social';

interface DockAction {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

function useDockActions(restaurant: Restaurant): DockAction[] {
  const actions: DockAction[] = [];

  const contactNumbers = restaurant.show_contact_numbers ? restaurant.contact_numbers ?? [] : [];
  if (contactNumbers[0]) {
    actions.push({ key: 'call', label: 'Call', href: telHref(contactNumbers[0]), icon: Phone });
  }

  const addressParts = [restaurant.address, restaurant.city, restaurant.country].filter(Boolean);
  if (addressParts.length > 0) {
    actions.push({
      key: 'directions',
      label: 'Directions',
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(', '))}`,
      icon: MapPin,
      external: true,
    });
  }

  const socialLinks = restaurant.show_social_media ? restaurant.social_links ?? {} : {};
  Object.entries(socialLinks).forEach(([platform, value]) => {
    if (!value) return;
    const Icon = SOCIAL_ICON_MAP[platform];
    if (!Icon) return;
    actions.push({
      key: platform,
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      href: normalizeSocialUrl(platform, value),
      icon: Icon,
      external: true,
    });
  });

  return actions;
}

async function handleShare(restaurant: Restaurant) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: restaurant.name, url });
      return;
    }
  } catch {
    // user cancelled — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Menu link copied');
  } catch {
    toast.error('Could not copy link');
  }
}

export function QuickContactDock({
  restaurant,
  theme,
}: {
  restaurant: Restaurant;
  theme: RestaurantTheme;
}) {
  const actions = useDockActions(restaurant);
  if (actions.length === 0) return null;

  return (
    <>
      <DesktopRail actions={actions} restaurant={restaurant} theme={theme} />
      <MobileFab actions={actions} restaurant={restaurant} theme={theme} />
    </>
  );
}

/* ============================= Desktop side rail ============================= */

function DesktopRail({
  actions,
  restaurant,
  theme,
}: {
  actions: DockAction[];
  restaurant: Restaurant;
  theme: RestaurantTheme;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="hidden lg:flex fixed left-5 top-1/2 -translate-y-1/2 z-30 flex-col gap-2 p-2 rounded-full"
      style={{
        backgroundColor: hexToRgba(theme.colors.surface, 0.9),
        boxShadow: theme.shadow.lg,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {actions.map((action) => (
        <RailButton key={action.key} action={action} theme={theme} />
      ))}

      <div className="h-px mx-1" style={{ backgroundColor: theme.colors.border }} />

      <button
        type="button"
        onClick={() => handleShare(restaurant)}
        aria-label="Share this menu"
        title="Share this menu"
        className="group relative w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{ color: theme.colors.textSecondary }}
      >
        <Share2 className="w-[18px] h-[18px]" />
        <RailTooltip label="Share" theme={theme} />
      </button>
    </motion.div>
  );
}

function RailButton({ action, theme }: { action: DockAction; theme: RestaurantTheme }) {
  const Icon = action.icon;
  return (
    <a
      href={action.href}
      target={action.external ? '_blank' : undefined}
      rel={action.external ? 'noopener noreferrer' : undefined}
      aria-label={action.label}
      title={action.label}
      className="group relative w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
      style={{ color: theme.colors.textSecondary }}
    >
      <Icon className="w-[18px] h-[18px]" />
      <RailTooltip label={action.label} theme={theme} />
    </a>
  );
}

function RailTooltip({ label, theme }: { label: string; theme: RestaurantTheme }) {
  return (
    <span
      className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
      style={{
        backgroundColor: theme.colors.textPrimary,
        color: theme.colors.surface,
      }}
    >
      {label}
    </span>
  );
}

/* ============================= Mobile floating action button ============================= */

function MobileFab({
  actions,
  restaurant,
  theme,
}: {
  actions: DockAction[];
  restaurant: Restaurant;
  theme: RestaurantTheme;
}) {
  const [open, setOpen] = useState(false);

  const allActions: (DockAction & { onClick?: () => void })[] = [
    ...actions,
    { key: 'share', label: 'Share', href: '#', icon: Share2, onClick: () => handleShare(restaurant) },
  ];

  return (
    <div className="lg:hidden fixed right-4 bottom-24 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-end gap-3 mb-1"
          >
            {allActions.map((action, i) => {
              const Icon = action.icon;
              const content = (
                <>
                  <span
                    className="px-2.5 py-1 rounded-md text-xs font-medium shadow-md"
                    style={{ backgroundColor: theme.colors.surface, color: theme.colors.textPrimary }}
                  >
                    {action.label}
                  </span>
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: theme.colors.surface, color: theme.colors.primary }}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                </>
              );

              return (
                <motion.div
                  key={action.key}
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  className="flex items-center gap-2"
                >
                  {action.onClick ? (
                    <button
                      type="button"
                      onClick={() => {
                        action.onClick?.();
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                      aria-label={action.label}
                    >
                      {content}
                    </button>
                  ) : (
                    <a
                      href={action.href}
                      target={action.external ? '_blank' : undefined}
                      rel={action.external ? 'noopener noreferrer' : undefined}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2"
                      aria-label={action.label}
                    >
                      {content}
                    </a>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: open ? 135 : 0 }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{ backgroundColor: theme.colors.primary, color: theme.colors.primaryText }}
      >
        {open ? <X className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}

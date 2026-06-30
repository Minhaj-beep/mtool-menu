'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Restaurant } from '@/lib/types/database';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { hexToRgba } from '@/lib/theme/theme-engine';

export function Hero({ restaurant, theme }: { restaurant: Restaurant; theme: RestaurantTheme }) {
  const hasBanner = theme.hero !== 'minimal' && !!theme.bannerImageUrl;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: restaurant.name, url });
        return;
      }
    } catch {
      // user cancelled share sheet — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Menu link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const heroHeight = hasBanner
    ? 'h-[42vh] min-h-[280px] md:h-[52vh] md:min-h-[380px]'
    : 'py-12 md:py-16';

  return (
    <div className={`relative overflow-hidden ${hasBanner ? heroHeight : ''}`}>
      {hasBanner ? (
        <>
          <Image
            src={theme.bannerImageUrl!}
            alt={restaurant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${hexToRgba('#000000', 0.15)} 0%, ${hexToRgba(
                '#000000',
                0.65
              )} 100%)`,
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              theme.hero === 'minimal'
                ? theme.colors.background
                : `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
          }}
        />
      )}

      <div
        className={`relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end ${
          hasBanner ? 'pb-8 md:pb-10' : ''
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 w-full py-6 md:py-0"
        >
          <div className="text-center md:text-left flex-1">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 drop-shadow-lg"
              style={{
                color: hasBanner || theme.hero !== 'minimal' ? '#ffffff' : theme.colors.textPrimary,
                fontFamily: theme.font.family,
              }}
            >
              {restaurant.name}
            </h1>
            <p
              className="text-lg md:text-xl font-medium"
              style={{
                color: hasBanner || theme.hero !== 'minimal' ? hexToRgba('#ffffff', 0.9) : theme.colors.textSecondary,
              }}
            >
              Digital Menu
            </p>
          </div>

          <div className="flex items-center gap-4">
            {restaurant.logo_url && (
              <div
                className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full bg-white p-2"
                style={{
                  boxShadow: `0 12px 32px rgba(0,0,0,0.35), 0 0 0 4px ${hexToRgba('#ffffff', 0.3)}`,
                }}
              >
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            )}

            <button
              onClick={handleShare}
              aria-label="Share this menu"
              className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: hexToRgba('#ffffff', hasBanner || theme.hero !== 'minimal' ? 0.18 : 0.08),
                color: hasBanner || theme.hero !== 'minimal' ? '#ffffff' : theme.colors.textPrimary,
                outlineColor: theme.colors.primary,
              }}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

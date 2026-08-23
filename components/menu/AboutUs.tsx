'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { Restaurant } from '@/lib/types/database';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';

export function AboutUs({ restaurant, theme }: { restaurant: Restaurant; theme: RestaurantTheme }) {
  if (!restaurant.show_about_us) return null;

  const text = (restaurant.about_us ?? '').trim();
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="mb-8 md:mb-10 p-6 md:p-8"
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.sm,
        border: theme.cardStyle === 'outlined' ? `1px solid ${theme.colors.border}` : undefined,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: theme.colors.surfaceMuted }}
        >
          <BookOpen className="w-5 h-5" style={{ color: theme.colors.primary }} />
        </div>
        <h2
          className="text-xl md:text-2xl font-bold"
          style={{ color: theme.colors.textPrimary, fontFamily: theme.font.family }}
        >
          About Us
        </h2>
      </div>

      <p
        className="text-base leading-relaxed whitespace-pre-line"
        style={{ color: theme.colors.textSecondary }}
      >
        {text}
      </p>
    </motion.div>
  );
}

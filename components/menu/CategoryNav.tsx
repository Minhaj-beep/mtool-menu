'use client';

import { motion } from 'framer-motion';
import type { PublicMenuCategory } from './types';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { hexToRgba } from '@/lib/theme/theme-engine';

export function CategoryNav({
  categories,
  activeCategory,
  onSelect,
  theme,
}: {
  categories: PublicMenuCategory[];
  activeCategory: string | null;
  onSelect: (id: string) => void;
  theme: RestaurantTheme;
}) {
  if (categories.length <= 1) return null;

  return (
    <div
      className="sticky top-0 z-20 border-y mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-md"
      style={{
        backgroundColor: hexToRgba(theme.colors.surface, 0.85),
        borderColor: theme.colors.border,
      }}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className="relative px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors flex-shrink-0"
              style={{
                borderRadius: theme.radius.pill,
                color: isActive ? theme.colors.primaryText : theme.colors.textSecondary,
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="category-nav-active"
                  className="absolute inset-0"
                  style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

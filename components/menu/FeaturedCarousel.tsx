'use client';

import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { getCardSurfaceStyle, hexToRgba } from '@/lib/theme/theme-engine';
import { DishBadges } from './DishBadges';
import type { PublicMenuItem } from './types';

export function FeaturedCarousel({
  dishes,
  theme,
  onSelect,
}: {
  dishes: PublicMenuItem[];
  theme: RestaurantTheme;
  onSelect: (dish: PublicMenuItem) => void;
}) {
  if (dishes.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6" style={{ color: theme.colors.primary }} />
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: theme.colors.textPrimary, fontFamily: theme.font.family }}>
          Featured Dishes
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {dishes.map((dish, index) => (
          <button
            key={dish.id}
            onClick={() => onSelect(dish)}
            className="flex-shrink-0 w-64 text-left overflow-hidden transition-all duration-300 snap-start hover:-translate-y-1"
            style={getCardSurfaceStyle(theme)}
          >
            <div className="relative h-48">
              <Image src={dish.image_url!} alt={dish.name} fill sizes="256px" className="object-cover" />
              <div className="absolute top-2 left-2">
                <DishBadges dish={dish} index={index} hasImage={true} />
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 line-clamp-1" style={{ color: theme.colors.textPrimary }}>
                {dish.name}
              </h3>
              {dish.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
                  {dish.description}
                </p>
              )}
              <div
                className="inline-flex flex-col items-start px-3 py-1.5 text-sm font-semibold"
                style={{
                  backgroundColor: hexToRgba(theme.colors.primary, 0.12),
                  color: theme.colors.primary,
                  borderRadius: theme.radius.sm,
                }}
              >
                {dish.dish_variants?.length > 0 ? (
                  dish.dish_variants.map((v) => (
                    <span key={v.id}>
                      {v.name} — ₹{v.price}
                    </span>
                  ))
                ) : (
                  <span className="text-lg font-bold">₹{dish.price}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

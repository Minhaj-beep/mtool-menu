'use client';

import Image from 'next/image';
import { Search } from 'lucide-react';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { getCardSurfaceStyle, hexToRgba } from '@/lib/theme/theme-engine';
import { DishBadges } from './DishBadges';
import type { PublicMenuItem } from './types';

function PriceTag({
  dish,
  theme,
  size = 'md',
}: {
  dish: PublicMenuItem;
  theme: RestaurantTheme;
  size?: 'sm' | 'md';
}) {
  const textSize = size === 'sm' ? 'text-sm font-semibold' : 'text-lg md:text-xl font-bold';
  return (
    <div
      className="inline-flex flex-col items-start px-3 py-1.5 gap-0.5"
      style={{
        backgroundColor: hexToRgba(theme.colors.primary, 0.12),
        color: theme.colors.primary,
        borderRadius: theme.radius.sm,
      }}
    >
      {dish.dish_variants?.length > 0 ? (
        dish.dish_variants.map((v) => (
          <span key={v.id} className="text-sm leading-tight">
            {v.name} — ₹{v.price}
          </span>
        ))
      ) : (
        <span className={textSize}>₹{dish.price}</span>
      )}
    </div>
  );
}

export function DishCard({
  item,
  index,
  hasImage,
  theme,
  layout,
  onSelect,
}: {
  item: PublicMenuItem;
  index: number;
  hasImage: boolean;
  theme: RestaurantTheme;
  layout: 'grid' | 'list' | 'compact';
  onSelect: (dish: PublicMenuItem) => void;
}) {
  const cardSurface = getCardSurfaceStyle(theme);

  if (layout === 'grid') {
    return (
      <div
        className="overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
        style={cardSurface}
        onClick={() => onSelect(item)}
      >
        {hasImage ? (
          <button onClick={() => onSelect(item)} className="block relative w-full aspect-[4/3] overflow-hidden">
            <Image
              src={item.image_url!}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </button>
        ) : null}
        <div className="p-4">
          <DishBadges dish={item} index={index} hasImage={hasImage} />
          <h3 className="text-base font-bold mb-1 line-clamp-1" style={{ color: theme.colors.textPrimary }}>
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
              {item.description}
            </p>
          )}
          <PriceTag dish={item} theme={theme} size="sm" />
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <button
        onClick={() => onSelect(item)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasImage && (
            <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden" style={{ borderRadius: theme.radius.sm }}>
              <Image src={item.image_url!} alt={item.name} fill sizes="40px" className="object-cover" />
            </div>
          )}
          <span className="truncate font-medium" style={{ color: theme.colors.textPrimary }}>
            {item.name}
          </span>
        </div>
        <span className="flex-shrink-0 font-semibold text-sm" style={{ color: theme.colors.primary }}>
          {item.dish_variants?.length > 0 ? `from ₹${Math.min(...item.dish_variants.map((v) => v.price))}` : `₹${item.price}`}
        </span>
      </button>
    );
  }

  // list (default)
  return (
    <div className="px-6 py-5 md:px-8 md:py-6 transition-colors duration-200">
      <div className="flex gap-4 md:gap-6" onClick={() => onSelect(item)}>
        {hasImage && (
          <div className="flex-shrink-0">
            <button
              onClick={() => onSelect(item)}
              className="block group relative overflow-hidden"
              style={{ borderRadius: theme.radius.md }}
            >
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <Image
                  src={item.image_url!}
                  alt={item.name}
                  fill
                  sizes="128px"
                  className="object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <DishBadges dish={item} index={index} hasImage={hasImage} />
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-bold mb-1.5" style={{ color: theme.colors.textPrimary }}>
                {item.name}
              </h3>
              {item.description && (
                <p
                  className="text-sm md:text-base leading-relaxed line-clamp-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <PriceTag dish={item} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

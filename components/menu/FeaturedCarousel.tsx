'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (dishes.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.7), behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 1;
    const index = Math.round(el.scrollLeft / (cardWidth + 16));
    setActiveIndex(Math.min(index, dishes.length - 1));
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6" style={{ color: theme.colors.primary }} />
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: theme.colors.textPrimary, fontFamily: theme.font.family }}>
            Featured
          </h2>
        </div>

        {dishes.length > 1 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-transform hover:scale-105"
              style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-transform hover:scale-105"
              style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-4 sm:px-0"
        >
          {dishes.map((dish, index) => (
            <button
              key={dish.id}
              onClick={() => onSelect(dish)}
              className="flex-shrink-0 w-64 text-left overflow-hidden transition-all duration-300 snap-start hover:-translate-y-1.5 active:translate-y-0"
              style={getCardSurfaceStyle(theme)}
            >
              <div className="relative h-48">
                <Image src={dish.image_url!} alt={dish.name} fill sizes="256px" className="object-cover" />
                <div
                  className="absolute inset-x-0 bottom-0 h-14"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }}
                />
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

        {/* edge fades hint there's more to scroll */}
        <div
          className="pointer-events-none absolute top-0 bottom-4 left-0 w-6 sm:hidden"
          style={{ background: `linear-gradient(to right, ${theme.colors.background}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute top-0 bottom-4 right-0 w-10"
          style={{ background: `linear-gradient(to left, ${theme.colors.background}, transparent)` }}
        />
      </div>

      {dishes.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1">
          {dishes.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '18px' : '6px',
                backgroundColor: i === activeIndex ? theme.colors.primary : hexToRgba(theme.colors.primary, 0.25),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

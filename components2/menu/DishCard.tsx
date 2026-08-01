'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, ZoomIn } from 'lucide-react';
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
  const textSize = size === 'sm' ? 'text-sm font-bold' : 'text-lg md:text-xl font-bold';
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
          <span key={v.id} className="text-sm leading-tight font-semibold">
            {v.name} — ₹{v.price}
          </span>
        ))
      ) : (
        <span className={textSize}>₹{dish.price}</span>
      )}
    </div>
  );
}

const cardEnter = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

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
  const unavailable = item.is_available === false;
  const delay = Math.min(index, 8) * 0.045;

  if (layout === 'grid') {
    return (
      <motion.div
        variants={cardEnter}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, delay, ease: 'easeOut' }}
        className="overflow-hidden transition-all duration-300 hover:-translate-y-1.5 active:translate-y-0 group cursor-pointer"
        style={{
          ...cardSurface,
          boxShadow: cardSurface.boxShadow ?? theme.shadow.sm,
        }}
        onClick={() => onSelect(item)}
      >
        {hasImage ? (
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <Image
              src={item.image_url!}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
                unavailable ? 'grayscale opacity-60' : ''
              }`}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-16 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }}
            />
            {/* <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
              <DishBadges dish={item} index={index} hasImage={hasImage} />
            </div> */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </div>
            {unavailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                  Sold Out
                </span>
              </div>
            )}
          </div>
        ) : null}
        <div className="p-4">
          <h3
            className="text-base font-bold mb-1 line-clamp-1"
            style={{ color: unavailable ? theme.colors.textSecondary : theme.colors.textPrimary }}
          >
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
              {item.description}
            </p>
          )}
          <PriceTag dish={item} theme={theme} size="sm" />
        </div>
      </motion.div>
    );
  }

  if (layout === 'compact') {
    return (
      <motion.button
        variants={cardEnter}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03 }}
        onClick={() => onSelect(item)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]"
        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasImage && (
            <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden" style={{ borderRadius: theme.radius.sm }}>
              <Image
                src={item.image_url!}
                alt={item.name}
                fill
                sizes="40px"
                className={`object-cover ${unavailable ? 'grayscale opacity-60' : ''}`}
              />
            </div>
          )}
          <span
            className="truncate font-medium"
            style={{ color: unavailable ? theme.colors.textSecondary : theme.colors.textPrimary }}
          >
            {item.name}
            {unavailable && <span className="ml-2 text-xs font-semibold opacity-70">Sold out</span>}
          </span>
        </div>
        <span className="flex-shrink-0 font-semibold text-sm" style={{ color: theme.colors.primary }}>
          {item.dish_variants?.length > 0 ? `from ₹${Math.min(...item.dish_variants.map((v) => v.price))}` : `₹${item.price}`}
        </span>
      </motion.button>
    );
  }

  // list (default)
  return (
    <motion.div
      variants={cardEnter}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className="px-6 py-5 md:px-8 md:py-6 transition-colors duration-200 hover:bg-black/[0.015] cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="flex gap-4 md:gap-6">
        {hasImage && (
          <div className="flex-shrink-0">
            <div
              className="block group relative overflow-hidden"
              style={{ borderRadius: theme.radius.md }}
            >
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <Image
                  src={item.image_url!}
                  alt={item.name}
                  fill
                  sizes="128px"
                  className={`object-cover transition-transform group-hover:scale-110 ${
                    unavailable ? 'grayscale opacity-60' : ''
                  }`}
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {unavailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* <DishBadges dish={item} index={index} hasImage={hasImage} /> */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg md:text-xl font-bold mb-1.5"
                style={{ color: unavailable ? theme.colors.textSecondary : theme.colors.textPrimary }}
              >
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
    </motion.div>
  );
}

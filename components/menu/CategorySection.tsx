'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { getCardSurfaceStyle, hexToRgba } from '@/lib/theme/theme-engine';
import { DishCard } from './DishCard';
import type { PublicMenuCategoryNode, PublicMenuItem } from './types';

function DishList({
  dishes,
  layout,
  theme,
  allowImages,
  onSelectDish,
}: {
  dishes: PublicMenuItem[];
  layout: 'grid' | 'list' | 'compact';
  theme: RestaurantTheme;
  allowImages: boolean;
  onSelectDish: (dish: PublicMenuItem) => void;
}) {
  if (dishes.length === 0) {
    return (
      <div className="px-6 py-12 md:px-8 md:py-16 text-center" style={{ color: theme.colors.textSecondary }}>
        <p className="text-lg">No items in this category yet</p>
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 md:p-6">
        {dishes.map((item, dishIndex) => (
          <DishCard
            key={item.id}
            item={item}
            index={dishIndex}
            hasImage={!!(item.image_url && allowImages)}
            theme={theme}
            layout={layout}
            onSelect={onSelectDish}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={layout === 'compact' ? '' : 'divide-y'} style={{ borderColor: theme.colors.border }}>
      {dishes.map((item, dishIndex) => (
        <DishCard
          key={item.id}
          item={item}
          index={dishIndex}
          hasImage={!!(item.image_url && allowImages)}
          theme={theme}
          layout={layout}
          onSelect={onSelectDish}
        />
      ))}
    </div>
  );
}

export function CategorySection({
  category,
  index,
  isExpanded,
  onToggle,
  theme,
  layout,
  allowImages,
  onSelectDish,
  registerRef,
}: {
  category: PublicMenuCategoryNode;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  theme: RestaurantTheme;
  layout: 'grid' | 'list' | 'compact';
  allowImages: boolean;
  onSelectDish: (dish: PublicMenuItem) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  const hasChildren = category.children.length > 0;
  const dishCount = hasChildren
    ? category.children.reduce((sum, c) => sum + c.dishes.length, 0)
    : category.dishes.length;

  return (
    <div
      id={category.id}
      ref={(el) => registerRef(category.id, el)}
      className="overflow-hidden transition-shadow duration-300"
      style={getCardSurfaceStyle(theme)}
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 md:px-8 md:py-6 relative overflow-hidden text-left transition-colors"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(theme.colors.primary, 0.08)} 0%, ${hexToRgba(
            theme.colors.primary,
            0.02
          )} 100%)`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Badge
              className="text-lg md:text-xl font-bold px-4 py-1.5 shadow-sm"
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.primaryText }}
            >
              {index + 1}
            </Badge>
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ color: theme.colors.primary, fontFamily: theme.font.family }}
              >
                {category.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                {dishCount} {dishCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
          ) : (
            <ChevronDown className="w-6 h-6 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
          )}
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {hasChildren ? (
          <div>
            {category.children.map((sub) => (
              <div key={sub.id}>
                <div
                  className="px-6 py-3 md:px-8"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(theme.colors.primary, 0.05)} 0%, transparent 100%)`,
                    borderTop: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <h3 className="text-lg md:text-xl font-semibold" style={{ color: theme.colors.primary }}>
                    {sub.name}
                  </h3>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    {sub.dishes.length} {sub.dishes.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <DishList
                  dishes={sub.dishes}
                  layout={layout}
                  theme={theme}
                  allowImages={allowImages}
                  onSelectDish={onSelectDish}
                />
              </div>
            ))}
          </div>
        ) : (
          <DishList
            dishes={category.dishes}
            layout={layout}
            theme={theme}
            allowImages={allowImages}
            onSelectDish={onSelectDish}
          />
        )}
      </div>
    </div>
  );
}

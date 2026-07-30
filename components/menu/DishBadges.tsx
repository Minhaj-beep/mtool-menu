import { Award, Sparkles, TrendingUp } from 'lucide-react';
import type { PublicMenuItem } from './types';

export function DishBadges({
  dish,
  index,
  hasImage,
}: {
  dish: PublicMenuItem;
  index: number;
  hasImage: boolean;
}) {
  const badges: { text: string; icon: typeof Award; className: string }[] = [];

  if (index < 3 && hasImage) {
    badges.push({ text: "Chef's Special", icon: Award, className: 'bg-amber-500/90' });
  } else if (index < 5) {
    badges.push({ text: 'Popular', icon: TrendingUp, className: 'bg-blue-500/90' });
  }

  const maxPrice =
    dish.dish_variants?.length > 0 ? Math.max(...dish.dish_variants.map((v) => v.price)) : dish.price;

  if (hasImage && maxPrice > 200) {
    badges.push({ text: 'Premium', icon: Sparkles, className: 'bg-purple-500/90' });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <span
            key={i}
            className={`${badge.className} text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm`}
          >
            <Icon className="w-2.5 h-2.5" />
            {badge.text}
          </span>
        );
      })}
    </div>
  );
}

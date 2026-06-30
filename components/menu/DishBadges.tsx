import { Award, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const badges: { text: string; icon: typeof Award; color: string }[] = [];

  if (index < 3 && hasImage) {
    badges.push({ text: "Chef's Special", icon: Award, color: 'bg-amber-500' });
  } else if (index < 5) {
    badges.push({ text: 'Popular', icon: TrendingUp, color: 'bg-blue-500' });
  }

  const maxPrice =
    dish.dish_variants?.length > 0 ? Math.max(...dish.dish_variants.map((v) => v.price)) : dish.price;

  if (hasImage && maxPrice > 200) {
    badges.push({ text: 'Premium', icon: Sparkles, color: 'bg-purple-500' });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <Badge key={i} className={`${badge.color} text-white text-xs px-2 py-1 flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {badge.text}
          </Badge>
        );
      })}
    </div>
  );
}

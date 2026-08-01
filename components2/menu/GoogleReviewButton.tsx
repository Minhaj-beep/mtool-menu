import { ExternalLink, Star } from 'lucide-react';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';

export function GoogleReviewButton({
  placeId,
  theme,
}: {
  placeId: string;
  theme: RestaurantTheme;
}) {
  return (
    <div className="mb-10">
      <a
        href={`https://search.google.com/local/writereview?placeid=${placeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full text-base md:text-lg py-4 md:py-5 font-semibold transition-all duration-300 hover:scale-[1.01]"
        style={{
          backgroundColor: theme.colors.primary,
          color: theme.colors.primaryText,
          borderRadius: theme.buttonRadius,
          boxShadow: theme.shadow.md,
        }}
      >
        <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
        Leave us a Review on Google
        <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
      </a>
    </div>
  );
}

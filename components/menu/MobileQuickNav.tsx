'use client';

import { ArrowUp, Search } from 'lucide-react';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';

export function MobileQuickNav({
  theme,
  showScrollTop,
  onScrollTop,
}: {
  theme: RestaurantTheme;
  showScrollTop: boolean;
  onScrollTop: () => void;
}) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t shadow-lg"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
    >
      <div className="flex items-center justify-around py-3 px-4">
        <button
          onClick={() => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            input?.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 px-4 py-2 transition-colors"
          style={{ color: theme.colors.textSecondary }}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs font-medium">Search</span>
        </button>

        {showScrollTop && (
          <button
            onClick={onScrollTop}
            className="flex flex-col items-center gap-1 px-4 py-2 transition-all"
            style={{ color: theme.colors.primary }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <ArrowUp className="w-5 h-5" style={{ color: theme.colors.primaryText }} />
            </div>
            <span className="text-xs font-medium">Top</span>
          </button>
        )}
      </div>
    </div>
  );
}

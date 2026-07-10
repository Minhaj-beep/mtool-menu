'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { getCardSurfaceStyle } from '@/lib/theme/theme-engine';

export function SearchBar({
  value,
  onChange,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  theme: RestaurantTheme;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Remove focus from input
      // This hides the mobile keyboard
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative -mt-8 mb-6 z-10">
      <div
        className="p-4 transition-shadow"
        style={{
          ...getCardSurfaceStyle(theme),
          boxShadow: theme.shadow.lg,
        }}
      >
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{
              color: theme.colors.textSecondary,
            }}
          />

          <Input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            placeholder="Search dishes..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-10 h-12 text-base bg-transparent border-0 focus-visible:ring-2"
            style={{
              color: theme.colors.textPrimary,
              ['--tw-ring-color' as unknown as string]:
                theme.colors.primary,
            }}
          />

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{
                color: theme.colors.textSecondary,
              }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
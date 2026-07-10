'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import type { PublicMenuItem } from './types';

export function ImageModal({
  dish,
  theme,
  onClose,
}: {
  dish: PublicMenuItem;
  theme: RestaurantTheme;
  onClose: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  const showImage = Boolean(dish.image_url) && !imageError;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Reset image error if a different dish is shown
  useEffect(() => {
    setImageError(false);
  }, [dish.id, dish.image_url]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl max-h-[90vh] flex flex-col min-h-0 overflow-hidden"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.xl,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {showImage && (
            <div className="relative flex-shrink-0">
              <img
                src={dish.image_url!}
                alt={dish.name}
                className="w-full max-h-[60vh] object-contain"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                }}
                onError={() => setImageError(true)}
              />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 w-10 h-10 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                }}
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          )}

          {/* Show close button here when there is no valid image */}
          {!showImage && (
            <div className="flex justify-end p-4 pb-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                }}
              >
                <X
                  className="w-5 h-5"
                  style={{
                    color: theme.colors.textSecondary,
                  }}
                />
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth p-6 md:p-8">
            <div className="flex justify-between items-start gap-4 mb-3">
              <h3
                className="text-2xl md:text-3xl font-bold"
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.font.family,
                }}
              >
                {dish.name}
              </h3>

              <div className="flex flex-col items-end gap-1">
                {dish.dish_variants?.length > 0 ? (
                  <>
                    <div
                      className="text-xs"
                      style={{
                        color: theme.colors.textSecondary,
                      }}
                    >
                      Available Variants
                    </div>

                    {dish.dish_variants.map((v) => (
                      <div
                        key={v.id}
                        className="text-lg font-semibold"
                        style={{
                          color: theme.colors.primary,
                        }}
                      >
                        {v.name} — ₹{v.price}
                      </div>
                    ))}
                  </>
                ) : (
                  <div
                    className="text-2xl md:text-3xl font-bold"
                    style={{
                      color: theme.colors.primary,
                    }}
                  >
                    ₹{dish.price}
                  </div>
                )}
              </div>
            </div>

            {dish.description && (
              <p
                className="text-base md:text-lg leading-relaxed whitespace-pre-line"
                style={{
                  color: theme.colors.textSecondary,
                }}
              >
                {dish.description}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import type { PublicMenuItem } from './types';

export function ImageModal({
  dish,
  theme,
  showPrice = true,
  onClose,
}: {
  dish: PublicMenuItem;
  theme: RestaurantTheme;
  showPrice?: boolean;
  onClose: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const gallery = dish.image_urls?.length ? dish.image_urls : dish.image_url ? [dish.image_url] : [];
  const activeImage = gallery[activeIndex] ?? null;
  const showImage = Boolean(activeImage) && !imageError;
  const hasMultiple = gallery.length > 1;

  const goTo = (i: number) => {
    setImageError(false);
    setActiveIndex((i + gallery.length) % gallery.length);
  };
  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Reset image state if a different dish is shown
  useEffect(() => {
    setImageError(false);
    setActiveIndex(0);
  }, [dish.id]);

  // Keyboard navigation for multi-image galleries
  useEffect(() => {
    if (!hasMultiple) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMultiple, activeIndex, gallery.length]);

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
            <div
              className="relative flex-shrink-0"
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchStartX === null) return;
                const delta = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(delta) > 40) {
                  if (delta > 0) goPrev();
                  else goNext();
                }
                setTouchStartX(null);
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  src={activeImage!}
                  alt={`${dish.name}${hasMultiple ? ` (${activeIndex + 1}/${gallery.length})` : ''}`}
                  className="w-full max-h-[60vh] object-contain select-none"
                  style={{
                    backgroundColor: theme.colors.surfaceMuted,
                  }}
                  onError={() => setImageError(true)}
                  draggable={false}
                />
              </AnimatePresence>

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

              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>

                  <div
                    className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
                  >
                    {activeIndex + 1} / {gallery.length}
                  </div>

                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 px-4">
                    {gallery.map((url, i) => (
                      <button
                        key={url + i}
                        type="button"
                        aria-label={`Show image ${i + 1}`}
                        onClick={() => goTo(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === activeIndex ? 20 : 8,
                          height: 8,
                          backgroundColor:
                            i === activeIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
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

          {hasMultiple && (
            <div className="flex gap-2 px-4 md:px-6 py-2 overflow-x-auto flex-shrink-0" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {gallery.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`View image ${i + 1}`}
                  className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden transition-opacity"
                  style={{
                    outline: i === activeIndex ? `2px solid ${theme.colors.primary}` : 'none',
                    outlineOffset: '2px',
                    opacity: i === activeIndex ? 1 : 0.6,
                  }}
                >
                  <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
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

              {showPrice && (
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
              )}
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
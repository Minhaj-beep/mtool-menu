'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Images, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import type { GalleryImage } from '@/lib/types/database';
import { MAX_GALLERY_IMAGES } from '@/lib/types/database';
import type { RestaurantTheme } from '@/lib/theme/theme-engine';
import { hexToRgba } from '@/lib/theme/theme-engine';

const MAX_VISIBLE = MAX_GALLERY_IMAGES;

export function Gallery({
  images,
  theme,
}: {
  images: GalleryImage[] | null | undefined;
  theme: RestaurantTheme;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const gallery = images ?? [];
  if (gallery.length === 0) return null;

  const visible = gallery.slice(0, MAX_VISIBLE);
  const remaining = gallery.length - visible.length;

  const close = () => setActiveIndex(null);
  const goPrev = () =>
    setActiveIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
  const goNext = () =>
    setActiveIndex((i) => (i === null ? null : (i + 1) % gallery.length));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="mt-12 md:mt-16 mb-8 md:mb-10"
    >
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.colors.surfaceMuted }}
          >
            <Images className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h2
              className="text-xl md:text-2xl font-bold leading-tight"
              style={{ color: theme.colors.textPrimary, fontFamily: theme.font.family }}
            >
              Gallery
            </h2>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
              {gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 grid-rows-2 gap-2 md:gap-3 auto-rows-[110px] sm:auto-rows-[140px] md:auto-rows-[170px]">
        {visible.map((img, i) => {
          // First tile is the "hero" tile — spans 2x2 to break up the uniform grid.
          const isHero = i === 0;
          const isLastVisible = i === visible.length - 1 && remaining > 0;

          return (
            <button
              key={img.key || img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={[
                'relative group overflow-hidden',
                isHero ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1',
              ].join(' ')}
              style={{ borderRadius: theme.cardRadius, backgroundColor: theme.colors.surfaceMuted }}
              aria-label={img.caption || `View gallery photo ${i + 1}`}
            >
              <img
                src={img.url}
                alt={img.caption || `Gallery photo ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />

              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                style={{ backgroundColor: hexToRgba('#000000', 0.35) }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm scale-90 group-hover:scale-100 transition-transform duration-300"
                  style={{ backgroundColor: hexToRgba('#ffffff', 0.9) }}
                >
                  <Expand className="w-4 h-4 text-slate-800" />
                </div>
              </div>

              {img.caption && (
                <div
                  className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 text-[11px] md:text-xs font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(0deg, ${hexToRgba('#000000', 0.65)} 0%, transparent 100%)`,
                    color: '#ffffff',
                  }}
                >
                  {img.caption}
                </div>
              )}

              {isLastVisible && (
                <div
                  className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]"
                  style={{ backgroundColor: hexToRgba('#000000', 0.5) }}
                >
                  <span className="text-white text-lg md:text-xl font-bold">+{remaining}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <GalleryLightbox
        gallery={gallery}
        activeIndex={activeIndex}
        theme={theme}
        onClose={close}
        onPrev={goPrev}
        onNext={goNext}
      />
    </motion.div>
  );
}

function GalleryLightbox({
  gallery,
  activeIndex,
  theme,
  onClose,
  onPrev,
  onNext,
}: {
  gallery: GalleryImage[];
  activeIndex: number | null;
  theme: RestaurantTheme;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isOpen = activeIndex !== null;
  const active = isOpen ? gallery[activeIndex] : null;
  const hasMultiple = gallery.length > 1;

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (hasMultiple && e.key === 'ArrowLeft') onPrev();
      if (hasMultiple && e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, hasMultiple, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {isOpen && active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key={active.url}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.url}
              alt={active.caption || 'Gallery photo'}
              className="w-full max-h-[85vh] object-contain rounded-lg"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-10 h-10 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
                >
                  {activeIndex! + 1} / {gallery.length}
                </div>
              </>
            )}

            {active.caption && (
              <div
                className="absolute bottom-0 inset-x-0 px-4 py-3 text-sm rounded-b-lg"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
              >
                {active.caption}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

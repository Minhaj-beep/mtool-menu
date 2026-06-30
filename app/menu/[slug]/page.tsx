'use client';

import { useParams } from 'next/navigation';
import { Search, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicMenu } from '@/lib/hooks/use-public-menu';
import { buildTheme, themeToCssVars } from '@/lib/theme/theme-engine';
import { Hero } from '@/components/menu/Hero';
import { SearchBar } from '@/components/menu/SearchBar';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { CategorySection } from '@/components/menu/CategorySection';
import { FeaturedCarousel } from '@/components/menu/FeaturedCarousel';
import { ImageModal } from '@/components/menu/ImageModal';
import { SkeletonLoader } from '@/components/menu/SkeletonLoader';
import { MobileQuickNav } from '@/components/menu/MobileQuickNav';
import { GoogleReviewButton } from '@/components/menu/GoogleReviewButton';
import { UnavailableScreen, MenuNotFoundScreen } from '@/components/menu/StatusScreens';

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    restaurant,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    expandedCategories,
    toggleCategory,
    activeCategory,
    selectedDish,
    setSelectedDish,
    showScrollTop,
    registerCategoryRef,
    scrollToCategory,
    scrollToTop,
    planLimits,
    showGoogleReview,
    showWatermark,
    filteredCategories,
    categoryTree,
    navCategories,
    featuredDishes,
  } = usePublicMenu(slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error === 'subscription_unavailable' && restaurant) {
    return <UnavailableScreen restaurant={restaurant} />;
  }

  if (error || !restaurant) {
    return <MenuNotFoundScreen message={error} />;
  }

  const theme = buildTheme(restaurant);
  const allowImages = !!planLimits?.allowImages;

  return (
    <div
      className="min-h-screen pb-24 md:pb-8 relative"
      style={{ ...themeToCssVars(theme), backgroundColor: theme.colors.background, fontFamily: theme.font.family }}
    >
      {theme.backgroundImageUrl && (
        <>
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${theme.backgroundImageUrl})`, filter: 'blur(24px)', transform: 'scale(1.1)' }}
          />
          <div className="fixed inset-0 -z-10" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />
        </>
      )}

      <Hero restaurant={restaurant} theme={theme} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} theme={theme} />

        {!searchQuery && (
          <CategoryNav
            categories={navCategories}
            activeCategory={activeCategory}
            onSelect={scrollToCategory}
            theme={theme}
          />
        )}

        <div className="py-8 md:py-12">
          {showGoogleReview && restaurant.google_place_id && (
            <GoogleReviewButton placeId={restaurant.google_place_id} theme={theme} />
          )}

          {!searchQuery && <FeaturedCarousel dishes={featuredDishes} theme={theme} onSelect={setSelectedDish} />}

          {filteredCategories.length === 0 ? (
            <div
              className="text-center py-20 md:py-24"
              style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, boxShadow: theme.shadow.sm }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: theme.colors.surfaceMuted }}
              >
                <Search className="w-12 h-12" style={{ color: theme.colors.textSecondary }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                No dishes found
              </h3>
              <p className="text-lg mb-4" style={{ color: theme.colors.textSecondary }}>
                Try searching with different keywords
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline" className="mt-4">
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {categoryTree.map((category, categoryIndex) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  index={categoryIndex}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  theme={theme}
                  layout={theme.layout}
                  allowImages={allowImages}
                  onSelectDish={setSelectedDish}
                  registerRef={registerCategoryRef}
                />
              ))}
            </div>
          )}

          {showWatermark && (
            <div className="mt-16 text-center pb-8">
              <div
                className="inline-flex items-center gap-2 px-6 py-3 shadow-sm border"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.pill }}
              >
                <Utensils className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Powered by <span className="font-bold" style={{ color: theme.colors.textPrimary }}>mtoool menu</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileQuickNav theme={theme} showScrollTop={showScrollTop} onScrollTop={scrollToTop} />

      {selectedDish && <ImageModal dish={selectedDish} theme={theme} onClose={() => setSelectedDish(null)} />}
    </div>
  );
}

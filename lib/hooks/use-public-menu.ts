import { useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import { PLAN_LIMITS } from '@/lib/subscription/plans';
import type { PublicMenuCategory, PublicMenuCategoryNode, PublicMenuItem } from '@/components/menu/types';

export function usePublicMenu(slug: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<PublicMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<PublicMenuItem | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTrackedDishRef = useRef<string | null>(null);

  useEffect(() => {
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !loading) {
      const isMobile = window.innerWidth < 768;
      const initialExpanded = new Set<string>();
      categories.forEach((cat, index) => {
        if (!isMobile || index === 0) initialExpanded.add(cat.id);
      });
      setExpandedCategories(initialExpanded);
    }
  }, [categories, loading]);

  useEffect(() => {
    if (categories.length === 0 || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveCategory(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    categoryRefs.current.forEach((element) => {
      if (element) observerRef.current?.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, [categories, loading]);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: restaurantRow, error: restaurantError } = await supabaseBrowser
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (restaurantError || !restaurantRow) {
        setError('Restaurant not found');
        return;
      }

      const isExpired =
        restaurantRow.subscription_status === 'expired' ||
        restaurantRow.subscription_status === 'canceled';
      const isOnHold = restaurantRow.is_on_hold === true;

      if (isExpired || isOnHold) {
        setRestaurant(restaurantRow);
        setError('subscription_unavailable');
        return;
      }

      setRestaurant(restaurantRow);

      const { data, error: menuError } = await supabaseBrowser
        .from('menu_categories')
        .select(
          `
          id,
          name,
          display_order,
          parent_category_id,
          dishes (
            id,
            name,
            description,
            price,
            image_url,
            is_available,
            dish_variants (
              id,
              name,
              price
            )
          )
        `
        )
        .eq('restaurant_id', restaurantRow.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (menuError) {
        setError('Failed to load menu');
        return;
      }

      const formatted: PublicMenuCategory[] =
        data?.map((category: any) => ({
          ...category,
          parent_category_id: category.parent_category_id ?? null,
          dishes:
            category.dishes
              ?.map((item: any) => ({ ...item, dish_variants: item.dish_variants ?? [] }))
              .filter((item: any) => item.is_available) ?? [],
        })) ?? [];

      setCategories(formatted);
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const planLimits = restaurant ? PLAN_LIMITS[restaurant.subscription_plan] : null;

  useEffect(() => {
    if (!selectedDish || !restaurant) return;
    if (restaurant.subscription_plan !== 'pro' && restaurant.subscription_plan !== 'enterprise') return;
    if (lastTrackedDishRef.current === selectedDish.id) return;
    lastTrackedDishRef.current = selectedDish.id;

    fetch('/api/analytics/dish-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish_id: selectedDish.id, restaurant_id: restaurant.id }),
    });
  }, [selectedDish, restaurant]);

  const showGoogleReview = !!(planLimits?.googleReviewEnabled && restaurant?.google_place_id);
  const showWatermark = !planLimits?.removeWatermark;

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        dishes: category.dishes.filter(
          (dish) =>
            dish.name.toLowerCase().includes(query) ||
            dish.description?.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.dishes.length > 0);
  }, [categories, searchQuery]);

  const categoryTree = useMemo((): PublicMenuCategoryNode[] => {
    const map = new Map<string, PublicMenuCategoryNode>();
    const roots: PublicMenuCategoryNode[] = [];
    filteredCategories.forEach((c) => map.set(c.id, { ...c, children: [] }));
    map.forEach((node) => {
      if (node.parent_category_id && map.has(node.parent_category_id)) {
        map.get(node.parent_category_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [filteredCategories]);

  const navCategories = useMemo(() => categories.filter((c) => !c.parent_category_id), [categories]);

  const featuredDishes = useMemo(() => {
    const allDishes = categories.flatMap((cat) => cat.dishes);
    const dishesWithImages = allDishes.filter((dish) => dish.image_url && planLimits?.allowImages);
    return dishesWithImages.slice(0, 6);
  }, [categories, planLimits]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const registerCategoryRef = (id: string, el: HTMLDivElement | null) => {
    if (el) categoryRefs.current.set(id, el);
  };

  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current.get(categoryId);
    if (element) {
      const offset = 180;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return {
    restaurant,
    categories,
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
  };
}

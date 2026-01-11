'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type MenuCategory = {
  id: string;
  name: string;
  is_active: boolean;
  dishes_count: number;
};

/* -------------------------------------------------------------------------- */

export default function MenuCategoriesPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              LOAD CATEGORIES                                */
  /* -------------------------------------------------------------------------- */

  const loadCategories = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) return;

      const { data: restaurant, error: restaurantError } =
        await supabaseBrowser
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .single();

      if (restaurantError || !restaurant) {
        throw new Error('Restaurant not found');
      }

      setRestaurantId(restaurant.id);

      const { data, error } = await supabaseBrowser
        .from('menu_categories')
        .select(
          `
          id,
          name,
          is_active,
          dishes ( count )
        `
        )
        .eq('restaurant_id', restaurant.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formatted: MenuCategory[] =
        data?.map((category) => ({
          id: category.id,
          name: category.name,
          is_active: category.is_active,
          dishes_count:
            category.dishes?.[0]?.count ?? 0,
        })) ?? [];

      setCategories(formatted);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            CREATE CATEGORY                                  */
  /* -------------------------------------------------------------------------- */

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          restaurant_id: restaurantId,
          display_order: categories.length,
          is_active: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Category created');
      setNewCategoryName('');
      setDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                         TOGGLE CATEGORY ACTIVE                              */
  /* -------------------------------------------------------------------------- */

  const toggleCategoryActive = async (
    categoryId: string,
    current: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_active: !current,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      loadCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            DELETE CATEGORY                                  */
  /* -------------------------------------------------------------------------- */

  const deleteCategory = async (category: MenuCategory) => {
    if (category.is_active) {
      toast.error('Deactivate category before deleting');
      return;
    }

    if (
      !confirm(
        'Are you sure? This will delete all dishes inside this category.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/categories/${category.id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Category deleted');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Menu Categories
          </h1>
          <p className="text-slate-500 mt-1">
            {categories.length} categories
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new menu category
              </DialogDescription>
            </DialogHeader>

            <Label>Category name</Label>
            <Input
              placeholder="e.g. Starters"
              value={newCategoryName}
              onChange={(e) =>
                setNewCategoryName(e.target.value)
              }
            />

            <DialogFooter>
              <Button onClick={createCategory}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories */}
      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>
                    {category.dishes_count} dishes
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={() =>
                        toggleCategoryActive(
                          category.id,
                          category.is_active
                        )
                      }
                    />
                    <Badge
                      variant={
                        category.is_active
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {category.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </Badge>
                  </div>

                  {restaurantId && (
                    <Link
                      href={`/admin/restaurants/${restaurantId}/categories/${category.id}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        Edit
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      deleteCategory(category)
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

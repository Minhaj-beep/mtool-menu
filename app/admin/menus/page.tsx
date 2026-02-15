'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
import { Skeleton } from '@/components/ui/skeleton';

import { supabaseBrowser } from '@/lib/supabase/browser';
import {
  Plus,
  Trash2,
  ChevronRight,
  FolderOpen,
  GripVertical,
  Pencil,
} from 'lucide-react';
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
/*                           SORTABLE WRAPPER                                  */
/* -------------------------------------------------------------------------- */

function SortableCategory({
  category,
  children,
}: {
  category: MenuCategory;
  children: React.ReactNode;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex gap-3">
        <div
          {...listeners}
          {...attributes}
          className="flex items-center cursor-grab text-slate-400 hover:text-slate-600"
        >
          <GripVertical />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function MenuCategoriesPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [editingCategory, setEditingCategory] =
    useState<MenuCategory | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              LOAD CATEGORIES                               */
  /* -------------------------------------------------------------------------- */

  const loadCategories = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabaseBrowser
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) throw new Error('Restaurant not found');

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

      setCategories(
        data.map((c: any) => ({
          id: c.id,
          name: c.name,
          is_active: c.is_active,
          dishes_count: c.dishes?.[0]?.count ?? 0,
        }))
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              CREATE CATEGORY                               */
  /* -------------------------------------------------------------------------- */

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          restaurant_id: restaurantId,
          display_order: categories.length,
          is_active: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create category');
      }

      toast.success('Category created');
      setNewCategoryName('');
      setDialogOpen(false);
      loadCategories();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              UPDATE NAME                                   */
  /* -------------------------------------------------------------------------- */

  const updateCategoryName = async () => {
    if (!editingCategory) return;

    try {
      const res = await fetch(
        `/api/categories/${editingCategory.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editName }),
        }
      );

      if (!res.ok) throw new Error('Failed to update');

      toast.success('Category updated');
      setEditingCategory(null);
      loadCategories();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              TOGGLE ACTIVE                                 */
  /* -------------------------------------------------------------------------- */

  const toggleCategoryActive = async (
    id: string,
    current: boolean
  ) => {
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      loadCategories();
    } catch {
      toast.error('Failed to update');
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              DELETE CATEGORY                                */
  /* -------------------------------------------------------------------------- */

  const deleteCategory = async (category: MenuCategory) => {
    if (category.is_active) {
      toast.error('Deactivate category first');
      return;
    }

    if (!confirm('Delete this category and all dishes?')) return;

    try {
      await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });
      toast.success('Category deleted');
      loadCategories();
    } catch {
      toast.error('Delete failed');
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              DRAG & DROP                                   */
  /* -------------------------------------------------------------------------- */

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(
      (c) => c.id === active.id
    );
    const newIndex = categories.findIndex(
      (c) => c.id === over.id
    );

    const reordered = arrayMove(
      categories,
      oldIndex,
      newIndex
    );

    setCategories(reordered);

    await Promise.all(
      reordered.map((cat, index) =>
        supabaseBrowser
          .from('menu_categories')
          .update({ display_order: index })
          .eq('id', cat.id)
      )
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Menu Categories</h1>
          <p className="text-slate-600">
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
            </DialogHeader>
            <Input
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

      {/* EMPTY */}
      {categories.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FolderOpen className="mx-auto mb-4" />
            No categories yet
          </CardContent>
        </Card>
      )}

      {/* LIST */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
              >
                <Card>
                  <CardHeader className="flex flex-row justify-between">
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>
                        {category.dishes_count} dishes
                      </CardDescription>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() =>
                          toggleCategoryActive(
                            category.id,
                            category.is_active
                          )
                        }
                      />

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditName(category.name);
                        }}
                      >
                        <Pencil />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() =>
                          deleteCategory(category)
                        }
                      >
                        <Trash2 />
                      </Button>

                      {restaurantId && (
                        <Link
                          href={`/admin/restaurants/${restaurantId}/${category.id}`}
                        >
                          <Button size="sm" variant="outline">
                            Edit Dishes
                            <ChevronRight className="ml-1 w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </SortableCategory>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* EDIT DIALOG */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={() => setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={updateCategoryName}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

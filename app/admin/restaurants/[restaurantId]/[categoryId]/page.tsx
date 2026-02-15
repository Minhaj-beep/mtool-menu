'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // DialogPortal removed from imports — not needed here
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import { Plus, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_LIMITS } from '@/lib/subscription/plans';
import { Skeleton } from '@/components/ui/skeleton';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
  is_active: boolean;
  dishes: Dish[];
};

/* -------------------------------------------------------------------------- */
/*                              COMPONENT START                                */
/* -------------------------------------------------------------------------- */

export default function CategoryDishesPage() {
  const params = useParams();
  const router = useRouter();
  const { restaurantId, categoryId } = params as {
    restaurantId: string;
    categoryId: string;
  };

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [category, setCategory] = useState<MenuCategory | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog / editing
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Form
  const [newDish, setNewDish] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
  });

  // Image file to upload on save + preview URL
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Loaders for API actions
  const [processingSave, setProcessingSave] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Local optimistic state to reduce full reloads
  const [localCategory, setLocalCategory] = useState<MenuCategory | null>(null);

  /* -------------------------------------------------------------------------- */
  /*                                   LOAD                                     */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { data: restaurantData, error: rErr } = await supabaseBrowser
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single();

      if (rErr || !restaurantData) {
        throw new Error('Restaurant not found');
      }

      setRestaurant(restaurantData);

      const { data, error } = await supabaseBrowser
        .from('menu_categories')
        .select(`
          id,
          name,
          is_active,
          dishes (
            id,
            name,
            description,
            price,
            image_url,
            is_available
          )
        `)
        .eq('id', categoryId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (error || !data) throw new Error('Category not found');

      setCategory(data);
      setLocalCategory(data); // copy into local state for optimistic updates
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              IMAGE HANDLING                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    // create preview for selected file
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setImageFile(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !restaurant) return null;
    if (!PLAN_LIMITS[restaurant.subscription_plan].allowImages) return null;

    const presign = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: imageFile.name,
        fileType: imageFile.type,
      }),
    });

    const presignData = await presign.json();
    if (!presign.ok) throw new Error(presignData.error || 'Presign failed');

    // Upload via PUT to storage (S3/GCS style)
    await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': imageFile.type },
      body: imageFile,
    });

    return presignData.fileUrl as string;
  };

  /* -------------------------------------------------------------------------- */
  /*                          CREATE / UPDATE DISH                                */
  /* -------------------------------------------------------------------------- */

  const saveDish = async () => {
    if (!newDish.name || !newDish.price) {
      toast.error('Dish name and price are required');
      return;
    }

    setProcessingSave(true);

    try {
      let imageUrl: string | null = newDish.image_url || null;

      // Upload image only here when a new file is selected
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const payload = {
        name: newDish.name,
        description: newDish.description || null,
        price: Number(newDish.price),
        image_url: imageUrl,
        is_available: newDish.is_available,
        category_id: categoryId,
      };

      const method = editingDish ? 'PUT' : 'POST';
      const endpoint = editingDish ? `/api/dishes/${editingDish.id}` : '/api/dishes';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');

      toast.success(editingDish ? 'Dish updated' : 'Dish created');

      // local optimistic update: reload server state to keep in sync
      await loadData();

      // reset form & state
      setDishDialogOpen(false);
      setEditingDish(null);
      setImageFile(null);
      setImagePreviewUrl(null);
      setNewDish({
        name: '',
        description: '',
        price: '',
        image_url: '',
        is_available: true,
      });
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setProcessingSave(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                           TOGGLE AVAILABILITY (optimistic)                 */
  /* -------------------------------------------------------------------------- */

  const toggleDishAvailability = async (dishId: string, current: boolean) => {
    setTogglingId(dishId);

    // optimistic update: flip locally
    const prev = localCategory;
    setLocalCategory((c) =>
      c
        ? {
            ...c,
            dishes: c.dishes.map((d) =>
              d.id === dishId ? { ...d, is_available: !current } : d
            ),
          }
        : c
    );

    try {
      const res = await fetch(`/api/dishes/${dishId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !current }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Update failed');

      toast.success('Dish availability updated');
      // reload server state to be safe
      await loadData();
    } catch (e: any) {
      // revert
      setLocalCategory(prev);
      toast.error(e?.message || 'Update failed');
    } finally {
      setTogglingId(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                DELETE DISH (optimistic)                     */
  /* -------------------------------------------------------------------------- */

  const deleteDish = async (dishId: string) => {
    if (!confirm('Delete this dish permanently?')) return;

    setDeletingId(dishId);

    // optimistic remove
    const prev = localCategory;
    setLocalCategory((c) =>
      c ? { ...c, dishes: c.dishes.filter((d) => d.id !== dishId) } : c
    );

    try {
      const res = await fetch(`/api/dishes/${dishId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Delete failed');

      toast.success('Dish deleted');
      // reload server state to ensure consistency
      await loadData();
    } catch (e: any) {
      // revert
      setLocalCategory(prev);
      toast.error(e?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                 HELPERS                                     */
  /* -------------------------------------------------------------------------- */

  const dishesToRender = useMemo(() => {
    return localCategory?.dishes ?? category?.dishes ?? [];
  }, [localCategory, category]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }),
    []
  );

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                    */
  /* -------------------------------------------------------------------------- */

  if (loading)
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-40 rounded-lg" />
        <div className="grid grid-cols-1 gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    );

  if (!category) return <div className="p-4">Category not found</div>;

  return (
    <div className="space-y-6 p-4 pb-32">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{category.name}</h1>
          <p className="text-sm text-muted-foreground">
            {dishesToRender.length} {dishesToRender.length === 1 ? 'dish' : 'dishes'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/menus')}
            aria-label="Back to menus"
          >
            ← Back
          </Button>

          <Button
            onClick={() => {
              setEditingDish(null);
              setImageFile(null);
              setImagePreviewUrl(null);
              setNewDish({
                name: '',
                description: '',
                price: '',
                image_url: '',
                is_available: true,
              });
              setDishDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* dishes grid: single column on small, 2 cols on md */}
      <Card>
        <CardContent className="p-3">
          {dishesToRender.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No dishes yet — add your first dish
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dishesToRender.map((dish) => (
                <article
                  key={dish.id}
                  className="flex flex-col sm:flex-row gap-3 p-3 border rounded-lg bg-white"
                  aria-labelledby={`dish-${dish.id}-title`}
                >
                  <div className="w-full sm:w-28 h-28 flex-shrink-0 overflow-hidden rounded-md bg-slate-50 flex items-center justify-center">
                    {dish.image_url ? (
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <div className="text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 id={`dish-${dish.id}-title`} className="text-base font-medium">
                        {dish.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {dish.description ?? 'No description'}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold">{currencyFormatter.format(dish.price)}</div>

                        <Badge variant="outline" className="text-xs">
                          {dish.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dish.is_available}
                          onCheckedChange={() => toggleDishAvailability(dish.id, dish.is_available)}
                          disabled={togglingId === dish.id}
                          aria-label={`Toggle availability for ${dish.name}`}
                        />

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingDish(dish);
                            setImageFile(null);
                            setImagePreviewUrl(dish.image_url ?? null);
                            setNewDish({
                              name: dish.name,
                              description: dish.description ?? '',
                              price: dish.price.toString(),
                              image_url: dish.image_url ?? '',
                              is_available: dish.is_available,
                            });
                            setDishDialogOpen(true);
                          }}
                          aria-label={`Edit ${dish.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteDish(dish.id)}
                          disabled={deletingId === dish.id}
                          aria-label={`Delete ${dish.name}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dish add/edit dialog — DO NOT override positioning (DialogContent already handles portal + centering).
          Only pass size/visual classes (width/padding) here. */}
      <Dialog open={dishDialogOpen} onOpenChange={setDishDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4">
          <DialogHeader>
            <DialogTitle>{editingDish ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>
              {editingDish ? 'Update dish details' : 'Create a new dish'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {(imagePreviewUrl || newDish.image_url) && (
              <div className="w-full h-48 overflow-hidden rounded-md bg-slate-50">
                <img
                  src={imagePreviewUrl ?? newDish.image_url ?? ''}
                  alt={newDish.name || editingDish?.name || 'Dish image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <Input
              placeholder="Item name"
              value={newDish.name}
              onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
              aria-label="Item name"
            />

            <Textarea
              placeholder="Description"
              value={newDish.description}
              onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
              aria-label="Dish description"
            />

            <Input
              type="number"
              placeholder="Price (e.g. 199)"
              value={newDish.price}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  setNewDish({ ...newDish, price: val });
                }
              }}
              aria-label="Price"
            />

            {restaurant && PLAN_LIMITS[restaurant.subscription_plan].allowImages && (
              <div className="space-y-2">
                <label
                  htmlFor="dish-image"
                  className="inline-flex items-center gap-2 cursor-pointer select-none text-sm bg-slate-100 px-3 py-2 rounded"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{imageFile ? imageFile.name : newDish.image_url ? 'Using existing image' : 'Upload image'}</span>
                </label>
                <input id="dish-image" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={newDish.is_available}
                onCheckedChange={(checked) => setNewDish({ ...newDish, is_available: Boolean(checked) })}
                aria-label="Is available"
              />
              <span className="text-sm text-slate-600">Available</span>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDishDialogOpen(false);
                  setEditingDish(null);
                  setImageFile(null);
                  setImagePreviewUrl(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>

              <Button onClick={saveDish} disabled={processingSave} className="w-full">
                {processingSave ? 'Saving…' : editingDish ? 'Save changes' : 'Add Item'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

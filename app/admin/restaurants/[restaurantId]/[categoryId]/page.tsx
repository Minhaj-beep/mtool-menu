'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import {
  Plus,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_LIMITS } from '@/lib/subscription/plans';

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

export default function CategoryDishesPage() {
  const params = useParams();
  const router = useRouter();

  const { restaurantId, categoryId } = params as {
    restaurantId: string;
    categoryId: string;
  };

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [category, setCategory] =
    useState<MenuCategory | null>(null);

  const [loading, setLoading] = useState(true);

  const [dishDialogOpen, setDishDialogOpen] =
    useState(false);

  const [editingDish, setEditingDish] =
    useState<Dish | null>(null);

  const [newDish, setNewDish] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
  });

  const [uploadingImage, setUploadingImage] =
    useState(false);

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
      const { data: { user } } =
        await supabaseBrowser.auth.getUser();
      if (!user) return;

      const { data: restaurantData } =
        await supabaseBrowser
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .eq('owner_id', user.id)
          .single();

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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                               IMAGE UPLOAD                                  */
  /* -------------------------------------------------------------------------- */

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    const limits =
      PLAN_LIMITS[restaurant.subscription_plan];

    if (!limits.allowImages) {
      toast.error('Images not allowed on your plan');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      setNewDish((d) => ({
        ...d,
        image_url: data.fileUrl,
      }));

      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                          CREATE / UPDATE DISH                                */
  /* -------------------------------------------------------------------------- */

  const saveDish = async () => {
    if (!newDish.name || !newDish.price) {
      toast.error('Dish name and price are required');
      return;
    }

    const method = editingDish ? 'PUT' : 'POST';
    const url = editingDish
      ? `/api/dishes/${editingDish.id}`
      : '/api/dishes';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDish,
          price: Number(newDish.price),
          category_id: categoryId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        editingDish ? 'Dish updated' : 'Dish created'
      );

      setDishDialogOpen(false);
      setEditingDish(null);
      setNewDish({
        name: '',
        description: '',
        price: '',
        image_url: '',
        is_available: true,
      });

      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleDishAvailability = async (
    dishId: string,
    current: boolean
  ) => {
    try {
      await fetch(`/api/dishes/${dishId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !current }),
      });

      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                DELETE DISH                                  */
  /* -------------------------------------------------------------------------- */

  const deleteDish = async (dishId: string) => {
    if (!confirm('Delete this dish permanently?')) return;

    try {
      await fetch(`/api/dishes/${dishId}`, {
        method: 'DELETE',
      });

      toast.success('Dish deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /* -------------------------------------------------------------------------- */

  if (loading) return <div className="p-6">Loading...</div>;
  if (!category)
    return <div className="p-6">Category not found</div>;

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        <Button
          variant="outline"
          onClick={() =>
            router.push(
              `/admin/menus`
            )
          }
        >
          ← Back
        </Button>
      </div>

      <Button
        onClick={() => {
          setEditingDish(null);
          setDishDialogOpen(true);
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Dish
      </Button>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {category.dishes.map((dish) => (
            <div
              key={dish.id}
              className="flex gap-4 p-4 border rounded-lg"
            >
              {dish.image_url ? (
                <img
                  src={dish.image_url}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-100 flex items-center justify-center rounded">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}

              <div className="flex-1">
                <h4 className="font-medium">{dish.name}</h4>
                <p className="text-sm text-slate-500">
                  {dish.description}
                </p>
                <p className="font-semibold">₹ {dish.price}</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={dish.is_available}
                  onCheckedChange={() =>
                    toggleDishAvailability(
                      dish.id,
                      dish.is_available
                    )
                  }
                />
                <Badge>
                  {dish.is_available
                    ? 'Available'
                    : 'Unavailable'}
                </Badge>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingDish(dish);
                    setNewDish({
                      name: dish.name,
                      description: dish.description || '',
                      price: dish.price.toString(),
                      image_url: dish.image_url || '',
                      is_available: dish.is_available,
                    });
                    setDishDialogOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteDish(dish.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ----------------------------- ADD / EDIT DIALOG ----------------------------- */}

      <Dialog
        open={dishDialogOpen}
        onOpenChange={setDishDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDish ? 'Edit Dish' : 'Add Dish'}
            </DialogTitle>
            <DialogDescription>
              {editingDish
                ? 'Update dish details'
                : 'Create a new dish'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Dish name"
              value={newDish.name}
              onChange={(e) =>
                setNewDish({ ...newDish, name: e.target.value })
              }
            />

            <Textarea
              placeholder="Description"
              value={newDish.description}
              onChange={(e) =>
                setNewDish({
                  ...newDish,
                  description: e.target.value,
                })
              }
            />

            <Input
              type="number"
              placeholder="Price"
              value={newDish.price}
              onChange={(e) =>
                setNewDish({
                  ...newDish,
                  price: e.target.value,
                })
              }
            />

            {restaurant &&
              PLAN_LIMITS[restaurant.subscription_plan]
                .allowImages && (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              )}
          </div>

          <DialogFooter>
            <Button onClick={saveDish}>
              {editingDish ? 'Save Changes' : 'Add Dish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

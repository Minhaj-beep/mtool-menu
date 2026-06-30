export type DishVariant = {
  id: string;
  name: string;
  price: number;
};

export type PublicMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  dish_variants: DishVariant[];
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  display_order: number;
  parent_category_id: string | null;
  dishes: PublicMenuItem[];
};

export type PublicMenuCategoryNode = PublicMenuCategory & { children: PublicMenuCategory[] };

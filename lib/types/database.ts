export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'canceled';

// 🎨 Theming
export type ThemePreset =
  | 'minimal'
  | 'modern'
  | 'luxury'
  | 'coffee'
  | 'elegant'
  | 'dark'
  | 'custom';

export type ButtonStyle = 'rounded' | 'pill' | 'square';
export type CardStyle = 'shadow' | 'flat' | 'outlined' | 'glass';
export type MenuLayout = 'grid' | 'list' | 'compact';

export type FontFamilyOption =
  | 'Inter'
  | 'Poppins'
  | 'Roboto'
  | 'Montserrat'
  | 'Open Sans'
  | 'Lato'
  | 'Nunito'
  | 'Playfair Display';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  google_place_id: string | null;
  logo_url: string | null;
  theme_color: string;

  // 🎨 Branding / theming (see lib/theme/theme-engine.ts)
  secondary_theme_color: string | null;
  font_family: FontFamilyOption | string | null;
  banner_image_url: string | null;
  background_image_url: string | null;
  button_style: ButtonStyle | null;
  card_style: CardStyle | null;
  menu_layout: MenuLayout | null;
  dark_mode: boolean | null;
  theme_preset: ThemePreset | null;

  // 🔑 Subscription
  subscription_plan: SubscriptionPlan;
  subscription_cycle: BillingCycle;
  subscription_status: SubscriptionStatus;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  is_on_hold?: boolean | null;

  // 💳 Payments
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  razorpay_customer_id?: string | null;
  razorpay_subscription_id?: string | null;
  razorpay_order_id?: string | null;

  // 📸 Usage
  image_count: number;

  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  restaurant_id: string | null;
  created_at: string;
}

export interface Menu {
  id: string;
  restaurant_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  menu_id: string;
  name: string;
  display_order: number;
  parent_category_id: string | null;
  created_at: string;
}

export interface Dish {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuWithCategories extends Menu {
  categories: (Category & {
    dishes: Dish[];
  })[];
}

export interface RestaurantWithMenus extends Restaurant {
  menus: MenuWithCategories[];
}

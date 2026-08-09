import { NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/auth/require-super-admin';

/* =====================================================
   GET /api/master/restaurants
   Returns every restaurant with owner email, plan/status,
   and menu/dish/image usage counts.
===================================================== */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Service-role client deliberately bypasses RLS here — safe because
    // this whole route is already gated behind the super_admin check above.
    const admin = getSupabaseServiceRole();

    const [
      { data: restaurants, error: restaurantsError },
      { data: categories, error: categoriesError },
      { data: dishes, error: dishesError },
      ownerEmailById,
    ] = await Promise.all([
      admin
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false }),
      admin.from('menu_categories').select('id, restaurant_id'),
      admin.from('dishes').select('id, category_id'),
      getAllAuthUserEmails(admin),
    ]);

    if (restaurantsError) throw restaurantsError;
    if (categoriesError) throw categoriesError;
    if (dishesError) throw dishesError;

    const categoryToRestaurant = new Map(
      (categories ?? []).map((c: any) => [c.id, c.restaurant_id])
    );

    const categoryCountByRestaurant = new Map<string, number>();
    (categories ?? []).forEach((c: any) => {
      categoryCountByRestaurant.set(
        c.restaurant_id,
        (categoryCountByRestaurant.get(c.restaurant_id) ?? 0) + 1
      );
    });

    const dishCountByRestaurant = new Map<string, number>();
    (dishes ?? []).forEach((d: any) => {
      const restaurantId = categoryToRestaurant.get(d.category_id);
      if (!restaurantId) return;
      dishCountByRestaurant.set(
        restaurantId,
        (dishCountByRestaurant.get(restaurantId) ?? 0) + 1
      );
    });

    const result = (restaurants ?? []).map((r: any) => ({
      ...r,
      owner_email: r.owner_id ? ownerEmailById.get(r.owner_id) ?? null : null,
      category_count: categoryCountByRestaurant.get(r.id) ?? 0,
      dish_count: dishCountByRestaurant.get(r.id) ?? 0,
    }));

    return NextResponse.json({ restaurants: result });
  } catch (err) {
    console.error('Master restaurants error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* =====================================================
   There is no public `users` table to join against for owner
   emails, so we page through Supabase's built-in auth admin API
   instead and build an id -> email map.
===================================================== */
async function getAllAuthUserEmails(
  admin: ReturnType<typeof getSupabaseServiceRole>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const u of data.users) {
      if (u.email) map.set(u.id, u.email);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return map;
}

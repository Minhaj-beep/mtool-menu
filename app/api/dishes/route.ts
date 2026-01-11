import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { canPerformAction } from '@/lib/subscription/plans';

/* -------------------------------------------------
   GET /api/dishes?categoryId=uuid
-------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { data: dishes, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ dishes });
  } catch (error) {
    console.error('Get dishes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------
   POST /api/dishes
-------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    /* 1️⃣ Auth check */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    /* 2️⃣ Parse body */
    const {
      name,
      description,
      price,
      image_url,
      is_available,
      category_id,
    } = await request.json();

    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    /* 3️⃣ Load category → restaurant → subscription */
    const { data: category, error: categoryError } = await supabase
      .from('menu_categories')
      .select(`
        id,
        restaurant_id,
        restaurants (
          subscription_plan
        )
      `)
      .eq('id', category_id)
      .maybeSingle();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const restaurant = category.restaurants as any;

    /* 4️⃣ Count total dishes for this restaurant */
    const { data: allCategories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('id')
      .eq('restaurant_id', category.restaurant_id);

    if (categoriesError) {
      return NextResponse.json(
        { error: categoriesError.message },
        { status: 400 }
      );
    }

    const categoryIds = allCategories.map(c => c.id);

    const { data: existingDishes, error: dishesError } = await supabase
      .from('dishes')
      .select('id')
      .in('category_id', categoryIds);

    if (dishesError) {
      return NextResponse.json(
        { error: dishesError.message },
        { status: 400 }
      );
    }

    const dishCount = existingDishes.length;

    /* 5️⃣ Subscription enforcement */
    const permissionCheck = canPerformAction(
      restaurant.subscription_plan,
      {
        type: 'create_dish',
        currentCount: dishCount,
      }
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.reason },
        { status: 403 }
      );
    }

    /* 6️⃣ Create dish */
    const { data: dish, error: insertError } = await supabase
      .from('dishes')
      .insert({
        name,
        description,
        price,
        image_url,
        is_available: is_available ?? true,
        category_id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ dish });
  } catch (error) {
    console.error('Create dish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

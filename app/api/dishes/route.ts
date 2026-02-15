import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { canPerformAction } from '@/lib/subscription/plans';

/* =====================================================
   GET dishes by category
===================================================== */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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

    return NextResponse.json({ dishes: data });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}


/* =====================================================
   CREATE dish
===================================================== */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      description,
      price,
      image_url,
      is_available,
      category_id
    } = body;

    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }


    /* Get restaurant id via category */
    const { data: category } = await supabase
      .from('menu_categories')
      .select('restaurant_id, restaurants(subscription_plan)')
      .eq('id', category_id)
      .single();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const restaurantId = category.restaurant_id;
    const plan = (category as any).restaurants.subscription_plan;


    /* Check subscription limits */
    const { data: existing } = await supabase
      .from('menu_categories')
      .select('id')
      .eq('restaurant_id', restaurantId);

    const categoryIds = (existing ?? []).map(c => c.id);

    const { data: dishes } = await supabase
      .from('dishes')
      .select('id')
      .in('category_id', categoryIds);

    const dishCount = (dishes ?? []).length;

    const permission = canPerformAction(plan, {
      type: 'create_dish',
      currentCount: dishCount
    });


    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }


    /* Create dish */
    const { data: dish, error } = await supabase
      .from('dishes')
      .insert({
        name,
        description,
        price,
        image_url,
        is_available: is_available ?? true,
        category_id
      })
      .select()
      .single();


    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }


    /* Increment image count */
    if (image_url) {

      await supabase.rpc(
        'adjust_image_count',
        {
          rid: restaurantId,
          delta: 1
        }
      );

    }


    return NextResponse.json({ dish });

  }
  catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );

  }
}

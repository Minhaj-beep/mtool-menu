import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, restaurantName, restaurantSlug } =
      await request.json();

    if (!email || !password || !restaurantName || !restaurantSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 🔥 SERVICE ROLE CLIENT (bypasses RLS)
    const supabase = getSupabaseServiceRole();

    // 1️⃣ Check restaurant slug uniqueness
    const { data: existingRestaurant, error: slugError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', restaurantSlug)
      .maybeSingle();

    if (slugError) {
      console.error(slugError);
      return NextResponse.json(
        { error: 'Failed to check restaurant slug' },
        { status: 500 }
      );
    }

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant slug already exists' },
        { status: 400 }
      );
    }

    // 2️⃣ CREATE AUTH USER (ADMIN CONTEXT — THIS IS CRITICAL)
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      console.error(authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // 3️⃣ CREATE RESTAURANT (FK + RLS SAFE)
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: authData.user.id, // ✅ FK → auth.users(id)
        name: restaurantName,
        slug: restaurantSlug,
        subscription_plan: 'free',
        subscription_status: 'active',
      })
      .select()
      .single();

    if (restaurantError || !restaurant) {
      console.error(restaurantError);
      return NextResponse.json(
        { error: 'Failed to create restaurant' },
        { status: 500 }
      );
    }

    // ✅ SUCCESS
    return NextResponse.json({
      message: 'Account created successfully',
      user: authData.user,
      restaurant,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

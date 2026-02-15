import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { deleteS3File, extractS3Key } from '@/lib/aws/s3';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // 1️⃣ Fetch existing dish image
    const { data: existingDish, error: fetchError } =
      await supabase
        .from('dishes')
        .select('image_url')
        .eq('id', params.id)
        .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      );
    }

    // 2️⃣ Normalize incoming image_url
    const newImageUrl =
      typeof updates.image_url === 'string' &&
      updates.image_url.trim() !== ''
        ? updates.image_url
        : null;

    // 3️⃣ Delete old image ONLY if replaced
    if (
      existingDish?.image_url &&
      newImageUrl &&
      existingDish.image_url !== newImageUrl
    ) {
      const oldKey = extractS3Key(existingDish.image_url);
      if (oldKey) {
        await deleteS3File(oldKey);
      }
    }

    // 4️⃣ Prevent empty string overwrite
    if (!newImageUrl) {
      delete updates.image_url;
    }

    // 5️⃣ Update dish
    const { data: dish, error } = await supabase
      .from('dishes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ dish });
  } catch (error) {
    console.error('Update dish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 1️⃣ Fetch dish image
    const { data: dish, error: fetchError } =
      await supabase
        .from('dishes')
        .select('image_url')
        .eq('id', params.id)
        .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      );
    }

    // 2️⃣ Delete image from S3 (if exists)
    if (dish?.image_url) {
      const key = extractS3Key(dish.image_url);
      if (key) {
        await deleteS3File(key);
      }
    }

    // 3️⃣ Delete dish row
    const { error: deleteError } = await supabase
      .from('dishes')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Dish deleted successfully',
    });
  } catch (error) {
    console.error('Delete dish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

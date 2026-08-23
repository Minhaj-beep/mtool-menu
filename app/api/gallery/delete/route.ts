import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { deleteS3File } from '@/lib/aws/s3';
import type { GalleryImage } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Image key is required' }, { status: 400 });
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, gallery_images')
      .eq('owner_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const existing: GalleryImage[] = restaurant.gallery_images ?? [];
    const updatedGallery = existing.filter((img) => img.key !== key);

    // Best-effort S3 cleanup — don't block the DB update on it.
    const s3Result = await deleteS3File(key);
    if (!s3Result.success) {
      console.warn('Gallery S3 delete warning:', s3Result.error);
    }

    const { data: updatedRestaurant, error } = await supabase
      .from('restaurants')
      .update({ gallery_images: updatedGallery, updated_at: new Date().toISOString() })
      .eq('id', restaurant.id)
      .select()
      .single();

    if (error || !updatedRestaurant) {
      return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 400 });
    }

    return NextResponse.json({ restaurant: updatedRestaurant });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

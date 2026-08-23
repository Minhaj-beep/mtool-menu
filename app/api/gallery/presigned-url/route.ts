import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { generatePresignedUploadUrl } from '@/lib/aws/s3';
import { MAX_GALLERY_IMAGES, type GalleryImage } from '@/lib/types/database';

// Gallery uploads are available on every subscription plan — no plan/limit check here,
// unlike /api/upload/presigned-url which gates dish photo uploads.
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'File name and type are required' }, { status: 400 });
    }

    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, gallery_images')
      .eq('owner_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const currentCount: number = (restaurant.gallery_images as GalleryImage[] | null)?.length ?? 0;
    if (currentCount >= MAX_GALLERY_IMAGES) {
      return NextResponse.json(
        { error: `You can only have up to ${MAX_GALLERY_IMAGES} gallery photos. Remove one before adding another.` },
        { status: 403 }
      );
    }

    const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl(
      restaurant.id,
      fileName,
      fileType,
      'gallery'
    );

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error('Generate gallery presigned URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

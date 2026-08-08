import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { deleteS3File, extractS3Key } from '@/lib/aws/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    /* Optional: caller can target a single image inside image_urls,
       e.g. DELETE /api/dishes/:id/image?url=https://... . When
       omitted, every image on the dish is removed (legacy behavior,
       kept for older clients that only support one image). */
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    /* Get dish */
    const { data: dish, error } = await supabase
      .from('dishes')
      .select(`
        image_url,
        image_urls,
        menu_categories (
          restaurant_id
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !dish) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    const currentImageUrls: string[] = Array.isArray(dish.image_urls)
      ? dish.image_urls
      : dish.image_url
        ? [dish.image_url]
        : [];

    if (currentImageUrls.length === 0) {
      return NextResponse.json(
        { error: 'No image to delete' },
        { status: 400 }
      );
    }

    if (targetUrl && !currentImageUrls.includes(targetUrl)) {
      return NextResponse.json(
        { error: 'Image not found on this dish' },
        { status: 404 }
      );
    }

    const imagesToDelete = targetUrl ? [targetUrl] : currentImageUrls;
    const remainingImageUrls = targetUrl
      ? currentImageUrls.filter((url) => url !== targetUrl)
      : [];

    const restaurantId =
      (dish as any).menu_categories.restaurant_id;

    /* Delete from S3 */
    for (const url of imagesToDelete) {
      const key = extractS3Key(url);
      if (key) {
        await deleteS3File(key);
      }
    }

    /* Update DB: remove image(s) */
    await supabase
      .from('dishes')
      .update({
        image_url: remainingImageUrls.length > 0 ? remainingImageUrls[0] : null,
        image_urls: remainingImageUrls,
        updated_at: new Date()
      })
      .eq('id', params.id);

    /* Update image count */
    await supabase.rpc('adjust_image_count', {
      rid: restaurantId,
      delta: -imagesToDelete.length
    });

    return NextResponse.json({
      success: true,
      image_urls: remainingImageUrls
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
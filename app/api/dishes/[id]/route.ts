import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { deleteS3File, extractS3Key } from '@/lib/aws/s3';


/* =====================================================
   UPDATE dish
===================================================== */
export async function PUT(
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

    const updates = await request.json();

    /* Extract variants safely */
    const variants = updates.variants;
    delete updates.variants;

    /* Get existing dish */
    const { data: existing } = await supabase
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

    if (!existing) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    const restaurantId =
      (existing as any).menu_categories.restaurant_id;

    /* =============================
       IMAGE HANDLING (multi-image)
       image_urls is the source of truth. image_url is kept in
       sync as the first image for backward compatibility with
       older clients that only understand a single image.
    ============================== */

    const imagesWereProvided =
      Object.prototype.hasOwnProperty.call(updates, 'image_urls') ||
      Object.prototype.hasOwnProperty.call(updates, 'image_url');

    if (imagesWereProvided) {
      const prevImageUrls: string[] = Array.isArray(existing.image_urls)
        ? existing.image_urls
        : existing.image_url
          ? [existing.image_url]
          : [];

      const newImageUrls: string[] = Array.isArray(updates.image_urls)
        ? updates.image_urls
            .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0)
            .map((u: string) => u.trim())
        : typeof updates.image_url === 'string' && updates.image_url.trim() !== ''
          ? [updates.image_url.trim()]
          : [];

      /* Any image that existed before but is no longer present must
         be removed from S3 so we never leak orphaned files. */
      const removedImages = prevImageUrls.filter((url) => !newImageUrls.includes(url));

      for (const url of removedImages) {
        const key = extractS3Key(url);
        if (key) await deleteS3File(key);
      }

      const countDelta = newImageUrls.length - prevImageUrls.length;
      if (countDelta !== 0) {
        await supabase.rpc('adjust_image_count', {
          rid: restaurantId,
          delta: countDelta
        });
      }

      updates.image_urls = newImageUrls;
      updates.image_url = newImageUrls.length > 0 ? newImageUrls[0] : null;
    }

    /* =============================
       UPDATE DISH FIRST (IMPORTANT)
    ============================== */

    const { data: dish, error } = await supabase
      .from('dishes')
      .update({
        ...updates,
        updated_at: new Date()
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

    /* =============================
       VALIDATE VARIANTS
    ============================== */

    if (
      variants &&
      variants.some((v: any) => !v.name || !v.price)
    ) {
      return NextResponse.json(
        { error: 'Invalid variants data' },
        { status: 400 }
      );
    }

    /* =============================
       UPDATE VARIANTS
    ============================== */

    if (variants !== undefined) {
      // Delete old variants
      const { error: deleteError } = await supabase
        .from('dish_variants')
        .delete()
        .eq('dish_id', params.id);

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 400 }
        );
      }

      // Insert new variants
      if (variants && variants.length > 0) {
        const variantRows = variants.map((v: any) => ({
          dish_id: params.id,
          name: v.name,
          price: Number(v.price),
        }));

        const { error: variantError } = await supabase
          .from('dish_variants')
          .insert(variantRows);

        if (variantError) {
          return NextResponse.json(
            { error: variantError.message },
            { status: 400 }
          );
        }
      }
    }

    /* =============================
       RESPONSE
    ============================== */

    return NextResponse.json({ dish });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}


/* =====================================================
   DELETE dish
===================================================== */
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


    const { data: dish } = await supabase
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


    if (!dish) {

      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );

    }



    const imageUrls: string[] = Array.isArray(dish.image_urls)
      ? dish.image_urls
      : dish.image_url
        ? [dish.image_url]
        : [];

    const restaurantId =
      (dish as any).menu_categories.restaurant_id;



    if (imageUrls.length > 0) {

      // Delete every image belonging to this dish from S3, not just
      // the primary one, so nothing is left orphaned in the bucket.
      for (const url of imageUrls) {
        const key = extractS3Key(url);
        if (key) {
          await deleteS3File(key);
        }
      }


      await supabase.rpc(
        'adjust_image_count',
        {
          rid: restaurantId,
          delta: -imageUrls.length
        }
      );

    }



    await supabase
      .from('dishes')
      .delete()
      .eq('id', params.id);



    return NextResponse.json({
      success: true
    });

  }
  catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );

  }

}

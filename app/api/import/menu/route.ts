import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

/* =====================================================
   Bulk Menu Import API

   Accepts parsed rows from a CSV/XLSX file and imports
   Categories → Subcategories → Dishes → Variants,
   reusing existing records and never creating duplicates.

   POST /api/import/menu
   body: { restaurant_id, rows: ParsedRow[] }
   ===================================================== */

export interface ParsedRow {
  category_name: string;
  subcategory_name: string | null;
  dish_name: string;
  dish_description: string | null;
  dish_price: string | null;
  dish_is_available: string | null;
  variant_name: string | null;
  variant_price: string | null;
}

interface ValidationError {
  row: number;
  message: string;
}

const BOOL_TRUE = /^(true|yes|1)$/i;
const BOOL_FALSE = /^(false|no|0)$/i;

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                  */
/* -------------------------------------------------------------------------- */

function validateRows(rows: ParsedRow[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (rows.length === 0) {
    errors.push({ row: 0, message: 'No rows found in the file.' });
    return errors;
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-indexed, +1 for header row

    // Required: category_name
    if (!row.category_name || !row.category_name.trim()) {
      errors.push({ row: rowNum, message: 'Category name is required.' });
    }

    // Required: dish_name
    if (!row.dish_name || !row.dish_name.trim()) {
      errors.push({ row: rowNum, message: 'Dish name is required.' });
    }

    const hasVariant =
      row.variant_name && row.variant_name.trim().length > 0;

    // Price or variant required
    if (!hasVariant) {
      if (
        row.dish_price === null ||
        row.dish_price === undefined ||
        row.dish_price.trim() === ''
      ) {
        errors.push({
          row: rowNum,
          message:
            'Dish price is required when no variant is specified.',
        });
      } else if (isNaN(Number(row.dish_price)) || Number(row.dish_price) < 0) {
        errors.push({
          row: rowNum,
          message: `Invalid dish price "${row.dish_price}". Must be a non-negative number.`,
        });
      }
    }

    // Variant price validation
    if (hasVariant) {
      if (
        row.variant_price === null ||
        row.variant_price === undefined ||
        row.variant_price.trim() === ''
      ) {
        errors.push({
          row: rowNum,
          message: 'Variant price is required when variant name is provided.',
        });
      } else if (
        isNaN(Number(row.variant_price)) ||
        Number(row.variant_price) < 0
      ) {
        errors.push({
          row: rowNum,
          message: `Invalid variant price "${row.variant_price}". Must be a non-negative number.`,
        });
      }
    }

    // Boolean validation: dish_is_available
    if (
      row.dish_is_available &&
      row.dish_is_available.trim() !== '' &&
      !BOOL_TRUE.test(row.dish_is_available.trim()) &&
      !BOOL_FALSE.test(row.dish_is_available.trim())
    ) {
      errors.push({
        row: rowNum,
        message: `Invalid availability value "${row.dish_is_available}". Use TRUE or FALSE.`,
      });
    }

    // Hierarchy: subcategory without category
    if (
      (!row.category_name || !row.category_name.trim()) &&
      row.subcategory_name &&
      row.subcategory_name.trim()
    ) {
      errors.push({
        row: rowNum,
        message: 'Subcategory provided without a category.',
      });
    }
  });

  return errors;
}

/* -------------------------------------------------------------------------- */
/* POST                                                                        */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    /* 1️⃣ Auth */
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
    const body = await request.json();
    const { restaurant_id, rows } = body as {
      restaurant_id?: string;
      rows?: ParsedRow[];
    };

    if (!restaurant_id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Rows array is required' },
        { status: 400 }
      );
    }

    /* 3️⃣ Verify restaurant ownership */
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, subscription_plan')
      .eq('id', restaurant_id)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    /* 4️⃣ Validate all rows */
    const errors = validateRows(rows);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }

    /* 5️⃣ Load existing categories for this restaurant */
    const { data: existingCategories, error: catLoadError } = await supabase
      .from('menu_categories')
      .select('id, name, parent_category_id')
      .eq('restaurant_id', restaurant_id);

    if (catLoadError) {
      return NextResponse.json(
        { error: catLoadError.message },
        { status: 400 }
      );
    }

    // Map: "parentName::childName" → category id (childName empty for root)
    const categoryMap = new Map<string, string>();
    (existingCategories ?? []).forEach((c: any) => {
      const parent = existingCategories?.find(
        (p: any) => p.id === c.parent_category_id
      );
      const key = parent
        ? `${parent.name}::${c.name}`
        : `${c.name}::`;
      categoryMap.set(key, c.id);
    });

    /* 6️⃣ Get current max display_order for root categories */
    const { data: maxOrderRow } = await supabase
      .from('menu_categories')
      .select('display_order')
      .eq('restaurant_id', restaurant_id)
      .is('parent_category_id', null)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextDisplayOrder = (maxOrderRow as any)?.display_order ?? -1;

    /* 7️⃣ Import loop */
    const stats = {
      categoriesCreated: 0,
      categoriesReused: 0,
      subcategoriesCreated: 0,
      subcategoriesReused: 0,
      dishesCreated: 0,
      dishesReused: 0,
      variantsCreated: 0,
      variantsReused: 0,
    };

    // Track created records for potential rollback
    const createdCategoryIds: string[] = [];
    const createdDishIds: string[] = [];

    // Cache dish ids by "categoryId::dishName"
    const dishMap = new Map<string, string>();

    // Pre-load existing dishes for all existing categories
    if (existingCategories && existingCategories.length > 0) {
      const { data: existingDishes } = await supabase
        .from('dishes')
        .select('id, name, category_id')
        .in(
          'category_id',
          existingCategories.map((c: any) => c.id)
        );

      (existingDishes ?? []).forEach((d: any) => {
        dishMap.set(`${d.category_id}::${d.name}`, d.id);
      });
    }

    // Cache variant existence by "dishId::variantName::variantPrice"
    const variantSet = new Set<string>();

    for (const row of rows) {
      const categoryName = row.category_name.trim();
      const subcategoryName = row.subcategory_name?.trim() || null;
      const dishName = row.dish_name.trim();
      const description = row.dish_description?.trim() || null;
      const dishAvailable =
        row.dish_is_available && row.dish_is_available.trim() !== ''
          ? BOOL_TRUE.test(row.dish_is_available.trim())
          : true;
      const variantName = row.variant_name?.trim() || null;
      const variantPrice =
        row.variant_price !== null && row.variant_price !== undefined
          ? row.variant_price.trim()
          : null;

      /* --- Category --- */
      const categoryKey = `${categoryName}::`;
      let categoryId = categoryMap.get(categoryKey);

      if (categoryId) {
        stats.categoriesReused++;
      } else {
        nextDisplayOrder++;
        const { data: newCat, error: catErr } = await supabase
          .from('menu_categories')
          .insert({
            name: categoryName,
            restaurant_id,
            display_order: nextDisplayOrder,
            parent_category_id: null,
            is_active: true,
          })
          .select()
          .single();

        if (catErr || !newCat) {
          await rollback(supabase, createdCategoryIds, createdDishIds);
          return NextResponse.json(
            { error: `Failed to create category "${categoryName}": ${catErr?.message}` },
            { status: 400 }
          );
        }

        categoryId = newCat.id;
        categoryMap.set(categoryKey, newCat.id);
        createdCategoryIds.push(newCat.id);
        stats.categoriesCreated++;
      }

      /* --- Subcategory --- */
      let targetCategoryId = categoryId;

      if (subcategoryName) {
        const subcategoryKey = `${categoryName}::${subcategoryName}`;
        let subId = categoryMap.get(subcategoryKey);

        if (subId) {
          stats.subcategoriesReused++;
        } else {
          const { data: newSub, error: subErr } = await supabase
            .from('menu_categories')
            .insert({
              name: subcategoryName,
              restaurant_id,
              display_order: 0,
              parent_category_id: categoryId,
              is_active: true,
            })
            .select()
            .single();

          if (subErr || !newSub) {
            await rollback(supabase, createdCategoryIds, createdDishIds);
            return NextResponse.json(
              { error: `Failed to create subcategory "${subcategoryName}": ${subErr?.message}` },
              { status: 400 }
            );
          }

          subId = newSub.id;
          categoryMap.set(subcategoryKey, newSub.id);
          createdCategoryIds.push(newSub.id);
          stats.subcategoriesCreated++;
        }

        targetCategoryId = subId;
      }

      /* --- Dish --- */
      const dishKey = `${targetCategoryId}::${dishName}`;
      let dishId = dishMap.get(dishKey);

      if (dishId) {
        stats.dishesReused++;
      } else {
        const hasVariant = variantName !== null;

        const { data: newDish, error: dishErr } = await supabase
          .from('dishes')
          .insert({
            name: dishName,
            description,
            price: hasVariant ? 0 : Number(row.dish_price),
            image_url: null,
            is_available: dishAvailable,
            category_id: targetCategoryId,
          })
          .select()
          .single();

        if (dishErr || !newDish) {
          await rollback(supabase, createdCategoryIds, createdDishIds);
          return NextResponse.json(
            { error: `Failed to create dish "${dishName}": ${dishErr?.message}` },
            { status: 400 }
          );
        }

        dishId = newDish.id;
        dishMap.set(dishKey, newDish.id);
        createdDishIds.push(newDish.id);
        stats.dishesCreated++;
      }

      /* --- Variant --- */
      if (variantName && variantPrice !== null) {
        const vPrice = Number(variantPrice);
        const vKey = `${dishId}::${variantName}::${vPrice}`;

        if (variantSet.has(vKey)) {
          // Duplicate variant within the same import file — skip
          stats.variantsReused++;
        } else {
          // Check if variant already exists in DB
          const { data: existingVariant } = await supabase
            .from('dish_variants')
            .select('id')
            .eq('dish_id', dishId)
            .eq('name', variantName)
            .maybeSingle();

          if (existingVariant) {
            variantSet.add(vKey);
            stats.variantsReused++;
          } else {
            const { error: variantErr } = await supabase
              .from('dish_variants')
              .insert({
                dish_id: dishId,
                name: variantName,
                price: vPrice,
              });

            if (variantErr) {
              await rollback(
                supabase,
                createdCategoryIds,
                createdDishIds
              );
              return NextResponse.json(
                { error: `Failed to create variant "${variantName}" for dish "${dishName}": ${variantErr.message}` },
                { status: 400 }
              );
            }

            variantSet.add(vKey);
            stats.variantsCreated++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Import menu error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* ROLLBACK helper — best-effort cleanup of partially created records          */
/* -------------------------------------------------------------------------- */

async function rollback(
  supabase: ReturnType<typeof createSupabaseRouteClient>,
  categoryIds: string[],
  dishIds: string[]
) {
  try {
    if (dishIds.length > 0) {
      await supabase.from('dishes').delete().in('id', dishIds);
    }
    if (categoryIds.length > 0) {
      await supabase
        .from('menu_categories')
        .delete()
        .in('id', categoryIds);
    }
  } catch (e) {
    console.error('Rollback failed:', e);
  }
}

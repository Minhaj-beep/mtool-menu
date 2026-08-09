import { NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/auth/require-super-admin';

// Bare hostname only — no protocol, no path, no trailing slash.
// e.g. "thefifthcafe.com" or "menu.thefifthcafe.com", not
// "https://thefifthcafe.com/".
const HOSTNAME_PATTERN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/* =====================================================
   PATCH /api/master/restaurants/:id/domain
   Body: { domain: string }
   Sets (or, with an empty string, clears) a restaurant's
   custom_domain. Super-admin only.
===================================================== */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const raw = typeof body.domain === 'string' ? body.domain.trim().toLowerCase() : '';

    // Empty string = clear the domain.
    if (raw === '') {
      const admin = getSupabaseServiceRole();
      const { error } = await admin
        .from('restaurants')
        .update({ custom_domain: null })
        .eq('id', params.id);

      if (error) throw error;
      return NextResponse.json({ success: true, custom_domain: null });
    }

    // Strip an accidentally-pasted protocol/path so we only ever store
    // a bare hostname, e.g. "https://thefifthcafe.com/" -> "thefifthcafe.com".
    const hostname = raw
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');

    if (!HOSTNAME_PATTERN.test(hostname)) {
      return NextResponse.json(
        { error: 'That doesn\'t look like a valid domain, e.g. thefifthcafe.com' },
        { status: 400 }
      );
    }

    const admin = getSupabaseServiceRole();

    // Friendly uniqueness check before hitting the DB constraint, so we
    // can name which restaurant already has it.
    const { data: existing } = await admin
      .from('restaurants')
      .select('id, name')
      .eq('custom_domain', hostname)
      .maybeSingle();

    if (existing && existing.id !== params.id) {
      return NextResponse.json(
        { error: `${hostname} is already assigned to "${existing.name}"` },
        { status: 409 }
      );
    }

    const { data, error } = await admin
      .from('restaurants')
      .update({ custom_domain: hostname })
      .eq('id', params.id)
      .select('id, custom_domain')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, custom_domain: data.custom_domain });
  } catch (err) {
    console.error('Set custom domain error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

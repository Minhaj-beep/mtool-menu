import { createSupabaseRouteClient } from '@/lib/supabase/route';

/* =====================================================
   Shared authorization check

   IMPORTANT: this is the single gate for the whole master
   admin feature. Every route under /api/master/* must call
   this before touching the service-role client.

   There is no public `users` table in this project — auth is
   handled entirely by Supabase's built-in `auth.users`. So
   "super admin" is stored as `role: 'super_admin'` inside that
   user's app_metadata (auth.users.raw_app_meta_data), which is
   only writable via the service-role key / admin API — never by
   the user themselves. This is what keeps it a trustworthy check.
===================================================== */
export async function requireSuperAdmin() {
  const supabase = createSupabaseRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, status: 401, error: 'Unauthorized' };
  }

  if (user.app_metadata?.role !== 'super_admin') {
    return { authorized: false as const, status: 403, error: 'Forbidden' };
  }

  return { authorized: true as const, user };
}

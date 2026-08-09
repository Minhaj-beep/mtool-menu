# Master Admin (Super Admin) access

There is no separate `public.users` table in this project — auth is handled
entirely by Supabase's built-in `auth.users`. So the master admin feature
does **not** add any new table or column.

Instead, "super admin" is a `role` key stored in that user's
**app_metadata** (`auth.users.raw_app_meta_data`). App metadata is only
writable with the service-role key / admin API — a signed-in user can never
set this on themselves from the browser, which is what makes the check
trustworthy.

## Where it's enforced

- `app/api/master/restaurants/route.ts` — the real security boundary. It
  reads the caller's session user, checks `user.app_metadata.role ===
  'super_admin'` server-side, and only then uses the service-role client to
  read across all restaurants.
- `app/admin/layout.tsx` — reads the same field from the current session
  purely to decide whether to show the "Master Admin" link in the sidebar.
  This is a UI convenience only; it grants no access by itself.

## Granting master admin access

Run this once in the Supabase SQL editor (swap in the real email):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
where email = 'you@example.com';
```

The person will need to log out and back in (or just refresh, since Supabase
refreshes the session periodically) for the new app_metadata to show up in
their session.

## Revoking it

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data - 'role'
where email = 'you@example.com';
```

## Alternative: via the admin API instead of SQL

If you'd rather not touch `auth.users` directly, the same thing can be done
with the service-role key from a script or a one-off Node REPL:

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

await supabase.auth.admin.updateUserById('the-users-auth-uid', {
  app_metadata: { role: 'super_admin' },
});
```

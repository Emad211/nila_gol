# Supabase Auth — Production Runbook

This project uses Supabase Auth for customer and administrator identities. Authorization for administrator access is always decided by the `public.admins` allowlist and RLS, never by a public signup path.

## 1. Apply migrations

Apply every migration in `supabase/migrations/` to the production Supabase project, including:

- `0014_secure_admin_bootstrap.sql`

That migration removes the legacy trigger that promoted the first public signup to administrator and removes the now-unused public `admin_exists()` RPC.

## 2. Bootstrap an administrator safely

Do **not** create administrators from the public website.

1. Create/invite the administrator user from the Supabase Dashboard (`Authentication -> Users`) or another operator-controlled backend flow.
2. In the Supabase SQL editor, explicitly allowlist that user's UUID:

```sql
select id, email
from auth.users
order by created_at desc;

insert into public.admins (user_id)
values ('ADMIN_USER_UUID')
on conflict (user_id) do nothing;
```

Existing administrators are not removed by migration `0014`.

## 3. Auth URL configuration

In `Authentication -> URL Configuration`:

- Set the production Site URL to the canonical site origin.
- Allow the account route as a redirect URL, e.g. `https://www.nilagol.ir/account`.
- Add the corresponding Preview/Development account URLs only when those environments must receive confirmation or recovery links.

The frontend sends email-confirmation redirects to `/account` and password-recovery redirects to `/account?recovery=1`.

## 4. Email and password policy

For production:

- Keep email confirmation enabled for email/password signups.
- Configure a custom SMTP provider instead of relying on the Supabase trial mail service.
- Set minimum password length to **at least 8 characters** in Supabase Auth settings so the server policy matches the frontend.
- Enable stronger password requirements / leaked-password protection when available for the project plan.

## 5. Implemented customer flows

`/account` now supports:

- email/password signup
- email confirmation handling
- email/password sign-in
- sign-out
- password-reset email request
- recovery-link handling via Supabase `PASSWORD_RECOVERY`
- setting a new password after recovery
- changing password while signed in, with the current password supplied
- viewing only the signed-in user's orders (enforced by RLS)

The password-reset request uses a generic success message so the UI does not reveal whether an email is registered.

## 6. Administrator flow

`/admin/login` is login-only. It never creates an Auth user and never promotes a user to administrator.

After successful authentication, the frontend calls `public.is_admin()`. The protected admin route requires both an authenticated session and a positive allowlist result. Database RLS remains the authoritative access-control layer for admin data and writes.

## 7. Deployment verification checklist

After applying the migration and Auth settings, verify with a non-admin test account and a real administrator account:

1. New customer signup does not create a row in `public.admins`.
2. Email confirmation returns to `/account` and creates a valid session.
3. Non-admin users cannot open `/admin` and cannot perform admin CRUD through Supabase REST.
4. Admin login succeeds only for users already present in `public.admins`.
5. Forgot-password email returns to `/account?recovery=1` and allows a new password to be set.
6. The old password stops working after the reset; the new password works.
7. Signed-in password change rejects an incorrect current password.
8. Customer order history only returns rows belonging to that user's `auth.uid()`.

Do not expose a Supabase service-role key in Vite/Vercel client environment variables. The frontend should only receive the public/publishable (anon) key.

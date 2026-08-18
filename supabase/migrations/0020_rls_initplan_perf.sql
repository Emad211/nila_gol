-- RLS performance: wrap auth.uid() / is_admin() in a scalar subquery so the
-- planner evaluates them ONCE per statement (an InitPlan) instead of re-running
-- the function for every candidate row. This is Supabase's documented fix for
-- the `auth_rls_initplan` advisor and is *semantically identical* to the prior
-- policies — the boolean each row sees is unchanged; only evaluation count drops.
--
-- Scope is deliberately limited to `orders` and `chat_messages` (the only tables
-- the advisor flags) because they filter by the per-row `user_id = auth.uid()`.
-- The catalog tables (`products`/`features`/`gallery`/`posts`) only call
-- is_admin() in their admin-override policy and are not flagged; they are left
-- untouched to keep this migration minimal and low-risk.
--
-- Intentionally NOT addressed here (documented as by-design in CLAUDE.md):
--   * multiple_permissive_policies — the public-read + admin-override pattern is
--     the security model; collapsing it would obscure intent for a micro-win.
--   * is_admin() SECURITY DEFINER being authenticated-executable — required so
--     the client can gate admin UI via rpc('is_admin'); it leaks nothing.

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
drop policy if exists "orders select own or admin" on public.orders;
create policy "orders select own or admin" on public.orders for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "orders admin manage" on public.orders;
create policy "orders admin manage" on public.orders for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders for insert to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and char_length(customer_name) between 1 and 120
    and char_length(phone) between 4 and 30
    and char_length(coalesce(note, '')) <= 1000
    and char_length(coalesce(postal_code, '')) <= 20
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 50
    and subtotal > 0
    and payment_method in ('cod','online')
    and payment_status = 'unpaid'
    and payment_ref_id is null
    and paid_at is null
    and payment_token_hash ~ '^[0-9a-f]{64}$'
  );

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
drop policy if exists "chat select own or admin" on public.chat_messages;
create policy "chat select own or admin" on public.chat_messages for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "chat customer insert" on public.chat_messages;
create policy "chat customer insert" on public.chat_messages for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and sender = 'customer'
    and char_length(body) between 1 and 2000
  );

drop policy if exists "chat admin all" on public.chat_messages;
create policy "chat admin all" on public.chat_messages for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

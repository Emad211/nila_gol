-- AI-chat cost guard: DB-backed rate limiting for the `ai-chat` Edge Function.
--
-- The assistant proxies paid LLM calls (Avalai), so an unbounded client could
-- run up a real bill just by spamming messages. This adds a small, atomic
-- counter table plus a SECURITY DEFINER RPC that the Edge Function (service
-- role) calls *before* hitting the upstream model. Anon/authenticated clients
-- can neither read nor call it — only the service role, from inside the
-- function, so the limit can't be bypassed from the browser.
--
-- Windows (per client IP hash), generous for a real shopper, tight on a bot:
--   * 10 messages / minute   (burst)
--   * 40 messages / hour
--   * 120 messages / day
-- Plus a global safety cap of 4000 messages/day across everyone — the wallet
-- backstop that IP-rotation can't evade.
--
-- Fixed-window counters, incremented atomically via INSERT ... ON CONFLICT DO
-- UPDATE ... RETURNING (no read-then-write race). The per-IP windows are
-- checked in order minute -> hour -> day and return on the first breach, so a
-- momentarily burst-throttled visitor doesn't burn their daily quota. Old rows
-- are swept opportunistically (~1% of calls) so the table stays tiny without
-- needing pg_cron.

create table if not exists public.ai_chat_usage (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

-- Locked down: no client ever touches this table directly.
alter table public.ai_chat_usage enable row level security;
revoke all on public.ai_chat_usage from anon, authenticated;

create or replace function public.ai_chat_rate_check(p_ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now        timestamptz := now();
  v_min_start  timestamptz := date_trunc('minute', v_now);
  v_hour_start timestamptz := date_trunc('hour', v_now);
  v_day_start  timestamptz := date_trunc('day', v_now);
  v_ip         text := coalesce(nullif(p_ip_hash, ''), 'unknown');
  v_hits       integer;
  -- Tunable thresholds (see file header).
  c_min    constant integer := 10;
  c_hour   constant integer := 40;
  c_day    constant integer := 120;
  c_global constant integer := 4000;
begin
  -- Opportunistic sweep of stale rows (keeps the table bounded, no cron needed).
  if random() < 0.01 then
    delete from public.ai_chat_usage where window_start < v_day_start - interval '2 days';
  end if;

  -- Per-IP: minute
  insert into public.ai_chat_usage (bucket, window_start, hits)
    values ('ip:' || v_ip || ':min', v_min_start, 1)
    on conflict (bucket, window_start) do update set hits = public.ai_chat_usage.hits + 1
    returning hits into v_hits;
  if v_hits > c_min then
    return jsonb_build_object('allowed', false, 'scope', 'minute',
      'retry_after', greatest(1, ceil(extract(epoch from (v_min_start + interval '1 minute' - v_now)))::int));
  end if;

  -- Per-IP: hour
  insert into public.ai_chat_usage (bucket, window_start, hits)
    values ('ip:' || v_ip || ':hour', v_hour_start, 1)
    on conflict (bucket, window_start) do update set hits = public.ai_chat_usage.hits + 1
    returning hits into v_hits;
  if v_hits > c_hour then
    return jsonb_build_object('allowed', false, 'scope', 'hour',
      'retry_after', greatest(1, ceil(extract(epoch from (v_hour_start + interval '1 hour' - v_now)))::int));
  end if;

  -- Per-IP: day
  insert into public.ai_chat_usage (bucket, window_start, hits)
    values ('ip:' || v_ip || ':day', v_day_start, 1)
    on conflict (bucket, window_start) do update set hits = public.ai_chat_usage.hits + 1
    returning hits into v_hits;
  if v_hits > c_day then
    return jsonb_build_object('allowed', false, 'scope', 'day',
      'retry_after', greatest(1, ceil(extract(epoch from (v_day_start + interval '1 day' - v_now)))::int));
  end if;

  -- Global daily wallet backstop (only counted once per-IP checks pass).
  insert into public.ai_chat_usage (bucket, window_start, hits)
    values ('global:day', v_day_start, 1)
    on conflict (bucket, window_start) do update set hits = public.ai_chat_usage.hits + 1
    returning hits into v_hits;
  if v_hits > c_global then
    return jsonb_build_object('allowed', false, 'scope', 'global',
      'retry_after', greatest(1, ceil(extract(epoch from (v_day_start + interval '1 day' - v_now)))::int));
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

-- Callable only by the service role (the Edge Function). Never from the client.
revoke all on function public.ai_chat_rate_check(text) from public, anon, authenticated;
grant execute on function public.ai_chat_rate_check(text) to service_role;

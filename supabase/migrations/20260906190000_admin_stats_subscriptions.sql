begin;

-- Extends admin_get_stats() (20260828162132_admin_stats, applied directly
-- to the project -- its own migration file was never committed to this
-- repo, so this one carries the previous definition forward in full
-- rather than assuming it) with a breakdown of household subscription
-- state, split the same way lib/subscription/queries.ts's hasAccess()
-- already reasons about it, plus one further split the app itself never
-- needs: a household made 'active' without an Apple transaction behind
-- it (a manually comped account, e.g. the owner's own household) counts
-- separately from one an actual App Store purchase put there -- lumping
-- them together would overstate real revenue.
--
-- The OUT parameter shape is changing, which Postgres won't do in place
-- (42P13) -- drop and recreate rather than CREATE OR REPLACE.
drop function if exists public.admin_get_stats();

create function public.admin_get_stats()
returns table(
  households bigint,
  workers bigint,
  owners_and_members bigint,
  total_users bigint,
  lists_draft bigint,
  lists_sent bigint,
  lists_viewed bigint,
  lists_completed bigint,
  lists_archived bigint,
  new_users_7d bigint,
  subscriptions_paid bigint,
  subscriptions_comped bigint,
  subscriptions_trialing bigint,
  subscriptions_lapsed bigint,
  subscriptions_expired_or_revoked bigint
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from users
    where id = auth.uid()
      and phone_number = '96565068000'
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from households),
    (select count(distinct user_id) from household_members where role = 'worker' and status = 'active'),
    (select count(distinct user_id) from household_members where role in ('owner', 'member') and status = 'active'),
    (select count(*) from users),
    (select count(*) from shopping_lists where status = 'draft'),
    (select count(*) from shopping_lists where status = 'sent'),
    (select count(*) from shopping_lists where status = 'viewed'),
    (select count(*) from shopping_lists where status = 'completed'),
    (select count(*) from shopping_lists where status = 'archived'),
    (select count(*) from users where created_at > now() - interval '7 days'),
    (select count(*) from households
       where subscription_status in ('active', 'grace_period')
         and apple_original_transaction_id is not null),
    (select count(*) from households
       where subscription_status in ('active', 'grace_period')
         and apple_original_transaction_id is null),
    (select count(*) from households
       where subscription_status = 'none' and now() < trial_ends_at),
    (select count(*) from households
       where subscription_status = 'none' and now() >= trial_ends_at),
    (select count(*) from households
       where subscription_status in ('expired', 'revoked'));
end;
$function$;

revoke all on function public.admin_get_stats() from public, anon;
grant execute on function public.admin_get_stats() to authenticated;

-- Every household that has ever left the free trial one way or another
-- (subscribed, lapsed into grace, expired, revoked, or was manually
-- comped) -- a household still simply mid-trial has nothing to show
-- here yet. There is no real per-transaction amount on file (Apple's
-- status callback never carries one, see lib/subscription/apple.ts), so
-- the admin UI shows the nominal listed price for an Apple-linked row
-- and "comped" for one without -- this function only supplies which is
-- which via apple_original_transaction_id.
create function public.admin_list_recent_subscriptions(p_limit int default 20)
returns table(
  household_id uuid,
  household_name text,
  owner_phone text,
  owner_name text,
  subscription_status text,
  apple_linked boolean,
  period_end timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from users
    where id = auth.uid()
      and phone_number = '96565068000'
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
  select
    h.id,
    h.name,
    u.phone_number,
    u.display_name,
    h.subscription_status,
    h.apple_original_transaction_id is not null,
    h.subscription_period_end,
    h.updated_at
  from households h
  join users u on u.id = h.owner_user_id
  where h.subscription_status <> 'none'
  order by h.updated_at desc
  limit p_limit;
end;
$function$;

revoke all on function public.admin_list_recent_subscriptions(int) from public, anon;
grant execute on function public.admin_list_recent_subscriptions(int) to authenticated;

-- Most recently created accounts, newest first -- the registered-users
-- table on the admin page.
create function public.admin_list_recent_users(p_limit int default 20)
returns table(
  id uuid,
  display_name text,
  phone_number text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from users
    where id = auth.uid()
      and phone_number = '96565068000'
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
  select u.id, u.display_name, u.phone_number, u.created_at
  from users u
  order by u.created_at desc
  limit p_limit;
end;
$function$;

revoke all on function public.admin_list_recent_users(int) from public, anon;
grant execute on function public.admin_list_recent_users(int) to authenticated;

commit;

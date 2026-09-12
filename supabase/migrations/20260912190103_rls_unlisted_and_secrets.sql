drop policy if exists status_pages_select_visible on public.status_pages;
create policy status_pages_select_visible
on public.status_pages
for select
to anon, authenticated
using (
  visibility = 'public'
  or private.is_org_member(organization_id)
);

drop policy if exists status_page_components_select_visible on public.status_page_components;
create policy status_page_components_select_visible
on public.status_page_components
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.status_pages as pages
    where pages.id = status_page_id
      and (
        pages.visibility = 'public'
        or private.is_org_member(pages.organization_id)
      )
  )
);

revoke select on table public.organizations from authenticated;
grant select (
  id,
  name,
  slug,
  icon_path,
  kind,
  plan_id,
  billing_status,
  created_by,
  created_at,
  updated_at,
  stripe_customer_id,
  stripe_subscription_id,
  billing_cycle,
  referral_code,
  referred_by_organization_id,
  timezone,
  default_regions,
  support_email,
  oidc_issuer,
  oidc_client_id
) on table public.organizations to authenticated;

revoke select on table public.contacts from authenticated;
grant select (
  id,
  organization_id,
  list_id,
  label,
  channel,
  destination,
  verified,
  enabled,
  created_at
) on table public.contacts to authenticated;

revoke select on table public.monitors from authenticated;
grant select (
  id,
  organization_id,
  name,
  type,
  target,
  keyword,
  port,
  interval_seconds,
  timeout_ms,
  method,
  regions,
  status,
  paused,
  consecutive_failures,
  confirmation_count,
  last_check_at,
  last_latency_ms,
  last_status_code,
  uptime_pct,
  next_check_at,
  created_by,
  created_at,
  updated_at
) on table public.monitors to authenticated;

create or replace function private.random_referral_code()
returns text
language plpgsql
set search_path = pg_catalog
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  end loop;
  return result;
end;
$$;

revoke all on function private.random_referral_code() from public, anon, authenticated;
grant execute on function private.random_referral_code() to postgres;

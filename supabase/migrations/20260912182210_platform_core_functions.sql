create or replace function private.organization_members_fill_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.permission_mask is null or new.permission_mask = '' then
    new.permission_mask := case new.role
      when 'owner' then '32767'
      when 'admin' then '30719'
      else '5469'
    end;
  end if;

  if new.access_mode is null or new.access_mode = '' then
    new.access_mode := 'preset';
  end if;

  if new.status is null or new.status = '' then
    new.status := 'active';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_org_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_kind text;
  org_plan text;
  occupied integer;
  seat_limit integer;
  target_organization_id uuid;
begin
  target_organization_id := new.organization_id;

  select organizations.kind, organizations.plan_id
  into org_kind, org_plan
  from public.organizations as organizations
  where organizations.id = target_organization_id;

  if org_kind is null then
    raise exception 'organization not found';
  end if;

  select (
    (
      select count(*)::integer
      from public.organization_members as members
      where members.organization_id = target_organization_id
        and members.status = 'active'
    )
    +
    (
      select count(*)::integer
      from public.organization_invites as invites
      where invites.organization_id = target_organization_id
        and invites.accepted_at is null
    )
  )
  into occupied;

  if org_kind = 'single' then
    seat_limit := 1;
  else
    seat_limit := case org_plan
      when 'free' then 2
      when 'probe' then 3
      when 'sentinel' then 10
      when 'command' then 25
      else 2
    end;
  end if;

  if occupied > seat_limit then
    raise exception 'organization seat limit exceeded'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;


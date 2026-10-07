create or replace function private.enforce_org_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_kind text;
  org_plan text;
  org_billing text;
  occupied integer;
  seat_limit integer;
  target_organization_id uuid;
  member_email text;
  matching_pending integer := 0;
begin
  target_organization_id := new.organization_id;

  select organizations.kind, organizations.plan_id, organizations.billing_status
  into org_kind, org_plan, org_billing
  from public.organizations as organizations
  where organizations.id = target_organization_id;

  if org_kind is null then
    raise exception 'organization not found';
  end if;

  if org_billing is distinct from 'active' then
    org_plan := 'free';
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

  if tg_table_name = 'organization_members' and tg_op = 'INSERT' then
    select users.email
    into member_email
    from auth.users as users
    where users.id = new.user_id;

    if member_email is not null then
      select count(*)::integer
      into matching_pending
      from public.organization_invites as invites
      where invites.organization_id = target_organization_id
        and invites.accepted_at is null
        and lower(invites.email::text) = lower(member_email);
    end if;

    if matching_pending > 0 then
      occupied := occupied - 1;
    end if;
  end if;

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

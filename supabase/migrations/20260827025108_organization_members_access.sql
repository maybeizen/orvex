create extension if not exists citext with schema extensions;

alter table public.organization_members
  add column permission_mask text,
  add column access_mode text,
  add column status text,
  add column locked_at timestamptz,
  add column locked_by uuid references auth.users (id) on delete set null;

update public.organization_members
set
  permission_mask = case role
    when 'owner' then '6356955'
    when 'admin' then '3178477'
    else '110947'
  end,
  access_mode = 'preset',
  status = 'active'
where permission_mask is null;

alter table public.organization_members
  alter column permission_mask set not null,
  alter column access_mode set not null,
  alter column status set not null;

alter table public.organization_members
  add constraint organization_members_access_mode_check
    check (access_mode in ('preset', 'custom')),
  add constraint organization_members_status_check
    check (status in ('active', 'locked')),
  add constraint organization_members_locked_check
    check (
      (status = 'locked' and locked_at is not null)
      or (status = 'active' and locked_at is null and locked_by is null)
    );

create index organization_members_locked_by_idx
  on public.organization_members (locked_by);

create function private.organization_members_fill_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.permission_mask is null or new.permission_mask = '' then
    new.permission_mask := case new.role
      when 'owner' then '6356955'
      when 'admin' then '3178477'
      else '110947'
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

create trigger organization_members_fill_access
before insert on public.organization_members
for each row
execute function private.organization_members_fill_access();

create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email extensions.citext not null,
  invited_by uuid not null references auth.users (id) on delete restrict,
  permission_mask text not null,
  access_mode text not null,
  preset_role text,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint organization_invites_access_mode_check check (
    access_mode in ('preset', 'custom')
  ),
  constraint organization_invites_preset_role_check check (
    preset_role is null or preset_role in ('owner', 'admin', 'member')
  )
);

create unique index organization_invites_token_hash_idx
  on public.organization_invites (token_hash);

create unique index organization_invites_pending_email_idx
  on public.organization_invites (organization_id, lower(email::text))
  where accepted_at is null;

create index organization_invites_organization_id_idx
  on public.organization_invites (organization_id);

create index organization_invites_invited_by_idx
  on public.organization_invites (invited_by);

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
      when 'free' then 1
      when 'probe' then 1
      when 'sentinel' then 5
      when 'command' then 15
      else 1
    end;
  end if;

  if occupied > seat_limit then
    raise exception 'organization seat limit exceeded'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger organization_invites_seat_limit
after insert on public.organization_invites
for each row
execute function private.enforce_org_seat_limit();

alter table public.organization_invites enable row level security;

revoke all on table public.organization_invites from public, anon, authenticated;
grant select, insert, update, delete on table public.organization_invites to service_role;

revoke all on function private.organization_members_fill_access() from public, anon, authenticated;
grant execute on function private.organization_members_fill_access() to postgres;
grant execute on function private.enforce_org_seat_limit() to postgres;

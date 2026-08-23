create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  icon_path text,
  kind text not null,
  plan_id text not null,
  billing_status text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_length_check check (
    char_length(name) between 1 and 80
  ),
  constraint organizations_slug_format_check check (
    slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'
  ),
  constraint organizations_kind_check check (kind in ('single', 'team')),
  constraint organizations_plan_id_check check (
    plan_id in ('free', 'probe', 'sentinel', 'command')
  ),
  constraint organizations_billing_status_check check (
    billing_status in ('active', 'pending_checkout', 'past_due', 'canceled')
  ),
  constraint organizations_plan_kind_check check (
    plan_id not in ('sentinel', 'command') or kind = 'team'
  )
);

create unique index organizations_slug_lower_idx on public.organizations (lower(slug));
create index organizations_created_by_idx on public.organizations (created_by);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint organization_members_role_check check (
    role in ('owner', 'admin', 'member')
  )
);

create index organization_members_user_id_idx on public.organization_members (user_id);

alter table public.profiles
  add column active_organization_id uuid references public.organizations (id) on delete set null,
  add column tos_accepted_at timestamptz,
  add column marketing_opt_in boolean not null default false;

create index profiles_active_organization_id_idx on public.profiles (active_organization_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.organizations from public, anon, authenticated;
grant select on table public.organizations to authenticated;
grant update (name, slug, icon_path, updated_at) on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organizations to service_role;

revoke all on table public.organization_members from public, anon, authenticated;
grant select on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.organization_members to service_role;

create function private.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as members
    where members.organization_id = p_organization_id
      and members.user_id = (select auth.uid())
  );
$$;

create function private.org_role(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select members.role
  from public.organization_members as members
  where members.organization_id = p_organization_id
    and members.user_id = (select auth.uid())
  limit 1;
$$;

create function private.enforce_org_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_kind text;
  org_plan text;
  member_count integer;
  seat_limit integer;
begin
  select organizations.kind, organizations.plan_id
  into org_kind, org_plan
  from public.organizations as organizations
  where organizations.id = new.organization_id;

  if org_kind is null then
    raise exception 'organization not found';
  end if;

  select count(*)::integer
  into member_count
  from public.organization_members as members
  where members.organization_id = new.organization_id;

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

  if member_count > seat_limit then
    raise exception 'organization seat limit exceeded'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.is_org_member(uuid) from public, anon, authenticated;
revoke all on function private.org_role(uuid) from public, anon, authenticated;
revoke all on function private.enforce_org_seat_limit() from public, anon, authenticated;

grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.org_role(uuid) to authenticated;
grant execute on function private.enforce_org_seat_limit() to postgres;
grant execute on function private.set_updated_at() to postgres, authenticated;

create policy organizations_select_member
on public.organizations
for select
to authenticated
using (private.is_org_member(id));

create policy organizations_update_admins
on public.organizations
for update
to authenticated
using (private.org_role(id) in ('owner', 'admin'))
with check (private.org_role(id) in ('owner', 'admin'));

create policy organization_members_select_own
on public.organization_members
for select
to authenticated
using ((select auth.uid()) = user_id);

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function private.set_updated_at();

create trigger organization_members_seat_limit
after insert on public.organization_members
for each row
execute function private.enforce_org_seat_limit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-icons', 'org-icons', true, 1048576, array['image/webp']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists org_icons_public_select on storage.objects;
create policy org_icons_public_select
on storage.objects
for select
to public
using (bucket_id = 'org-icons');

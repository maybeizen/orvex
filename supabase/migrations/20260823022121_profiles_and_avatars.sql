create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  first_name text not null,
  last_name text not null,
  avatar_path text,
  avatar_source text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format_check check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_username_reserved_check check (
    username not in (
      'admin',
      'orvex',
      'settings',
      'profile',
      'login',
      'api',
      'register',
      'signup',
      'signin',
      'logout',
      'signout',
      'dashboard',
      'auth',
      'oauth',
      'callback',
      'reset',
      'forgot',
      'password',
      'account',
      'accounts',
      'user',
      'users',
      'me',
      'help',
      'support',
      'status',
      'billing',
      'security',
      'root',
      'system',
      'www',
      'home',
      'about',
      'avatar',
      'avatars'
    )
  ),
  constraint profiles_avatar_source_check check (avatar_source in ('none', 'upload', 'gravatar'))
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (username, first_name, last_name, updated_at) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create function private.is_reserved_username(p_username text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(p_username) in (
    'admin',
    'orvex',
    'settings',
    'profile',
    'login',
    'api',
    'register',
    'signup',
    'signin',
    'logout',
    'signout',
    'dashboard',
    'auth',
    'oauth',
    'callback',
    'reset',
    'forgot',
    'password',
    'account',
    'accounts',
    'user',
    'users',
    'me',
    'help',
    'support',
    'status',
    'billing',
    'security',
    'root',
    'system',
    'www',
    'home',
    'about',
    'avatar',
    'avatars'
  );
$$;

create function private.next_username(p_email text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  base text;
  candidate text;
  suffix integer := 0;
begin
  base := lower(split_part(coalesce(p_email, ''), '@', 1));
  base := regexp_replace(base, '[^a-z0-9_]', '', 'g');

  if char_length(base) < 3 then
    base := 'usr';
  elsif char_length(base) > 20 then
    base := left(base, 20);
  end if;

  candidate := base;

  while
    private.is_reserved_username(candidate)
    or exists (
      select 1
      from public.profiles as profiles
      where lower(profiles.username) = candidate
    )
  loop
    suffix := suffix + 1;
    candidate := left(base, 24 - char_length(suffix::text)) || suffix::text;
    if suffix > 1000 then
      raise exception 'could not allocate a unique username';
    end if;
  end loop;

  return candidate;
end;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb;
  first_name text;
  last_name text;
  full_name text;
  space_at integer;
  attempt integer;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name := nullif(btrim(coalesce(meta->>'first_name', meta->>'given_name', '')), '');
  last_name := nullif(btrim(coalesce(meta->>'last_name', meta->>'family_name', '')), '');
  full_name := nullif(btrim(coalesce(meta->>'full_name', meta->>'name', '')), '');

  if first_name is null and full_name is not null then
    space_at := position(' ' in full_name);
    if space_at = 0 then
      first_name := full_name;
    else
      first_name := left(full_name, space_at - 1);
      last_name := coalesce(last_name, nullif(btrim(substr(full_name, space_at + 1)), ''));
    end if;
  end if;

  for attempt in 1..20 loop
    begin
      insert into public.profiles (user_id, username, first_name, last_name)
      values (
        new.id,
        private.next_username(new.email),
        coalesce(first_name, 'User'),
        coalesce(last_name, '')
      );
      return new;
    exception
      when unique_violation then
        if attempt = 20 then
          raise;
        end if;
    end;
  end loop;

  return new;
end;
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.is_reserved_username(text) from public, anon, authenticated;
revoke all on function private.next_username(text) from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;

grant execute on function private.handle_new_user() to supabase_auth_admin;
grant execute on function private.next_username(text) to postgres, supabase_auth_admin;
grant execute on function private.is_reserved_username(text) to postgres, supabase_auth_admin;
grant execute on function private.set_updated_at() to postgres, authenticated;
grant usage on schema private to supabase_auth_admin, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/webp']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_select on storage.objects;
create policy avatars_public_select
on storage.objects
for select
to public
using (bucket_id = 'avatars');

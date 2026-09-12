alter table public.organizations
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column billing_cycle text,
  add column referral_code text,
  add column referred_by_organization_id uuid references public.organizations (id) on delete set null,
  add column timezone text not null default 'UTC',
  add column default_regions text[] not null default array['IAD']::text[],
  add column support_email text,
  add column oidc_issuer text,
  add column oidc_client_id text,
  add column oidc_client_secret text;

alter table public.organizations
  add constraint organizations_billing_cycle_check
    check (billing_cycle is null or billing_cycle in ('monthly', 'quarterly', 'yearly'));

create unique index organizations_referral_code_idx
  on public.organizations (referral_code)
  where referral_code is not null;

create unique index organizations_stripe_customer_id_idx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create function private.random_referral_code()
returns text
language plpgsql
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

create function private.organizations_fill_referral_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.referral_code is null or new.referral_code = '' then
    loop
      new.referral_code := private.random_referral_code();
      exit when not exists (
        select 1
        from public.organizations as organizations
        where organizations.referral_code = new.referral_code
      );
    end loop;
  end if;
  return new;
end;
$$;

create trigger organizations_fill_referral_code
before insert on public.organizations
for each row
execute function private.organizations_fill_referral_code();

update public.organizations
set referral_code = private.random_referral_code()
where referral_code is null;

alter table public.organizations
  alter column referral_code set not null;

update public.organization_members
set permission_mask = case role
  when 'owner' then '32767'
  when 'admin' then '30719'
  else '5469'
end
where permission_mask in ('6356955', '3178477', '110947')
   or access_mode = 'preset';

update public.organization_invites
set permission_mask = case preset_role
  when 'admin' then '30719'
  else '5469'
end
where accepted_at is null
  and permission_mask in ('6356955', '3178477', '110947');

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  monitor_id uuid references public.monitors (id) on delete set null,
  status text not null default 'open',
  severity text not null,
  source text not null,
  summary text not null,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  acknowledged_at timestamptz,
  constraint incidents_status_check check (
    status in ('open', 'acknowledged', 'resolved')
  ),
  constraint incidents_severity_check check (severity in ('down', 'degraded')),
  constraint incidents_source_check check (source in ('auto', 'manual'))
);

create index incidents_organization_status_idx
  on public.incidents (organization_id, status, started_at desc);
create index incidents_monitor_id_idx on public.incidents (monitor_id);

create table public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  body text not null,
  status_page_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index incident_updates_incident_id_idx
  on public.incident_updates (incident_id, created_at);

create table public.status_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  visibility text not null default 'public',
  theme jsonb not null default '{}'::jsonb,
  custom_domain text,
  domain_verified_at timestamptz,
  hide_branding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint status_pages_name_length_check check (char_length(name) between 1 and 80),
  constraint status_pages_slug_format_check check (
    slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'
  ),
  constraint status_pages_visibility_check check (
    visibility in ('public', 'unlisted', 'private')
  )
);

create unique index status_pages_org_slug_idx
  on public.status_pages (organization_id, lower(slug));
create unique index status_pages_custom_domain_idx
  on public.status_pages (lower(custom_domain))
  where custom_domain is not null;

create table public.status_page_components (
  id uuid primary key default gen_random_uuid(),
  status_page_id uuid not null references public.status_pages (id) on delete cascade,
  monitor_id uuid not null references public.monitors (id) on delete cascade,
  display_name text not null,
  sort integer not null default 0
);

create unique index status_page_components_unique_idx
  on public.status_page_components (status_page_id, monitor_id);

create table public.status_subscribers (
  id uuid primary key default gen_random_uuid(),
  status_page_id uuid not null references public.status_pages (id) on delete cascade,
  email extensions.citext not null,
  confirm_token_hash text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index status_subscribers_page_email_idx
  on public.status_subscribers (status_page_id, lower(email::text))
  where unsubscribed_at is null;

create table public.maintenance_windows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  status_page_id uuid references public.status_pages (id) on delete set null,
  monitor_ids uuid[] not null default array[]::uuid[],
  title text not null,
  body text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  suppress_alerts boolean not null default true,
  constraint maintenance_windows_range_check check (ends_at > starts_at)
);

create index maintenance_windows_organization_id_idx
  on public.maintenance_windows (organization_id, starts_at);

create table public.contact_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint contact_lists_name_length_check check (char_length(name) between 1 and 80)
);

create index contact_lists_organization_id_idx
  on public.contact_lists (organization_id);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  list_id uuid not null references public.contact_lists (id) on delete cascade,
  label text not null,
  channel text not null,
  destination text not null,
  encrypted_secret text,
  verified boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint contacts_channel_check check (
    channel in (
      'email',
      'sms',
      'voice',
      'slack',
      'discord',
      'webhook',
      'telegram',
      'msteams',
      'pushover',
      'pagerduty',
      'opsgenie',
      'googlechat',
      'mattermost'
    )
  )
);

create index contacts_list_id_idx on public.contacts (list_id);
create index contacts_organization_id_idx on public.contacts (organization_id);

create table public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  list_id uuid not null references public.contact_lists (id) on delete cascade,
  on_down boolean not null default true,
  on_recovery boolean not null default true,
  on_incident boolean not null default true,
  on_maintenance boolean not null default true
);

create unique index notification_rules_list_id_idx on public.notification_rules (list_id);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  incident_id uuid references public.incidents (id) on delete set null,
  channel text not null,
  status text not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now(),
  constraint notification_deliveries_status_check check (
    status in ('queued', 'sent', 'skipped', 'failed')
  )
);

create index notification_deliveries_contact_id_idx
  on public.notification_deliveries (contact_id, created_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  payload jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index audit_events_organization_created_idx
  on public.audit_events (organization_id, created_at desc);

create table public.billing_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stripe_checkout_session_id text,
  kind text not null,
  amount_cents integer not null default 0,
  status text not null,
  created_at timestamptz not null default now(),
  constraint billing_orders_kind_check check (
    kind in ('checkout', 'upgrade', 'downgrade', 'renewal', 'credit')
  ),
  constraint billing_orders_status_check check (
    status in ('open', 'complete', 'expired', 'canceled')
  )
);

create index billing_orders_organization_id_idx
  on public.billing_orders (organization_id, created_at desc);
create unique index billing_orders_session_idx
  on public.billing_orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_organization_id uuid not null references public.organizations (id) on delete cascade,
  referred_organization_id uuid not null references public.organizations (id) on delete cascade,
  status text not null default 'pending',
  stripe_credit_id text,
  created_at timestamptz not null default now(),
  constraint referrals_status_check check (
    status in ('pending', 'credited', 'reversed')
  ),
  constraint referrals_distinct_check check (
    referrer_organization_id <> referred_organization_id
  )
);

create unique index referrals_referred_org_idx
  on public.referrals (referred_organization_id);
create index referrals_referrer_org_idx
  on public.referrals (referrer_organization_id);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint support_tickets_status_check check (
    status in ('open', 'sent', 'failed')
  )
);

create index support_tickets_organization_id_idx
  on public.support_tickets (organization_id, created_at desc);


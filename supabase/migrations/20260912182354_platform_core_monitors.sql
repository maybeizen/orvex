create table public.monitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  type text not null,
  target text not null default '',
  keyword text,
  port integer,
  interval_seconds integer not null,
  timeout_ms integer not null default 10000,
  method text,
  headers_ciphertext text,
  regions text[] not null default array['IAD']::text[],
  status text not null default 'paused',
  paused boolean not null default false,
  consecutive_failures integer not null default 0,
  confirmation_count integer not null default 1,
  last_check_at timestamptz,
  last_latency_ms integer,
  last_status_code integer,
  uptime_pct numeric(6, 3),
  next_check_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monitors_name_length_check check (char_length(name) between 1 and 80),
  constraint monitors_type_check check (
    type in ('http', 'keyword', 'ping', 'port', 'heartbeat', 'agent')
  ),
  constraint monitors_status_check check (
    status in ('up', 'down', 'degraded', 'paused')
  ),
  constraint monitors_interval_check check (interval_seconds >= 5),
  constraint monitors_port_check check (
    port is null or (port between 1 and 65535)
  )
);

create index monitors_organization_id_idx on public.monitors (organization_id);
create index monitors_next_check_at_idx
  on public.monitors (next_check_at)
  where paused = false and type in ('http', 'keyword', 'ping', 'port');
create index monitors_organization_status_idx on public.monitors (organization_id, status);

create table public.monitor_tokens (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors (id) on delete cascade,
  token_hash text not null,
  kind text not null,
  last_seen_at timestamptz,
  last_payload jsonb,
  created_at timestamptz not null default now(),
  constraint monitor_tokens_kind_check check (kind in ('heartbeat', 'agent'))
);

create unique index monitor_tokens_token_hash_idx on public.monitor_tokens (token_hash);
create unique index monitor_tokens_monitor_kind_idx on public.monitor_tokens (monitor_id, kind);

create table public.check_results (
  id uuid not null default gen_random_uuid(),
  monitor_id uuid not null references public.monitors (id) on delete cascade,
  region text not null,
  started_at timestamptz not null default now(),
  latency_ms integer,
  status text not null,
  http_code integer,
  error text,
  primary key (id, started_at),
  constraint check_results_status_check check (
    status in ('up', 'down', 'degraded', 'paused')
  )
) partition by range (started_at);

create table public.check_results_default
  partition of public.check_results default;

create table public.check_results_2026_09
  partition of public.check_results
  for values from ('2026-09-01') to ('2026-10-01');

create table public.check_results_2026_10
  partition of public.check_results
  for values from ('2026-10-01') to ('2026-11-01');

create table public.check_results_2026_11
  partition of public.check_results
  for values from ('2026-11-01') to ('2026-12-01');

create table public.check_results_2026_12
  partition of public.check_results
  for values from ('2026-12-01') to ('2027-01-01');

create table public.check_results_2027_01
  partition of public.check_results
  for values from ('2027-01-01') to ('2027-02-01');

create table public.check_results_2027_02
  partition of public.check_results
  for values from ('2027-02-01') to ('2027-03-01');

create table public.check_results_2027_03
  partition of public.check_results
  for values from ('2027-03-01') to ('2027-04-01');

create index check_results_monitor_started_idx
  on public.check_results (monitor_id, started_at desc);

create table public.check_rollups (
  monitor_id uuid not null references public.monitors (id) on delete cascade,
  bucket text not null,
  period_start timestamptz not null,
  avg_latency_ms integer,
  max_latency_ms integer,
  up_count integer not null default 0,
  down_count integer not null default 0,
  primary key (monitor_id, bucket, period_start),
  constraint check_rollups_bucket_check check (bucket in ('5m', '1h'))
);


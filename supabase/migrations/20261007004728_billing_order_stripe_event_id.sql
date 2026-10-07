alter table public.billing_orders
  add column stripe_event_id text;

create unique index billing_orders_stripe_event_id_idx
  on public.billing_orders (stripe_event_id)
  where stripe_event_id is not null;

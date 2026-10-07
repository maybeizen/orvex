create trigger monitors_set_updated_at
before update on public.monitors
for each row
execute function private.set_updated_at();

create trigger status_pages_set_updated_at
before update on public.status_pages
for each row
execute function private.set_updated_at();

alter table public.monitors enable row level security;
alter table public.monitor_tokens enable row level security;
alter table public.check_results enable row level security;
alter table public.check_rollups enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_updates enable row level security;
alter table public.status_pages enable row level security;
alter table public.status_page_components enable row level security;
alter table public.status_subscribers enable row level security;
alter table public.maintenance_windows enable row level security;
alter table public.contact_lists enable row level security;
alter table public.contacts enable row level security;
alter table public.notification_rules enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.audit_events enable row level security;
alter table public.billing_orders enable row level security;
alter table public.referrals enable row level security;
alter table public.support_tickets enable row level security;

revoke all on table public.monitors from public, anon, authenticated;
revoke all on table public.monitor_tokens from public, anon, authenticated;
revoke all on table public.check_results from public, anon, authenticated;
revoke all on table public.check_rollups from public, anon, authenticated;
revoke all on table public.incidents from public, anon, authenticated;
revoke all on table public.incident_updates from public, anon, authenticated;
revoke all on table public.status_pages from public, anon, authenticated;
revoke all on table public.status_page_components from public, anon, authenticated;
revoke all on table public.status_subscribers from public, anon, authenticated;
revoke all on table public.maintenance_windows from public, anon, authenticated;
revoke all on table public.contact_lists from public, anon, authenticated;
revoke all on table public.contacts from public, anon, authenticated;
revoke all on table public.notification_rules from public, anon, authenticated;
revoke all on table public.notification_deliveries from public, anon, authenticated;
revoke all on table public.audit_events from public, anon, authenticated;
revoke all on table public.billing_orders from public, anon, authenticated;
revoke all on table public.referrals from public, anon, authenticated;
revoke all on table public.support_tickets from public, anon, authenticated;

grant select on table public.monitors to authenticated;
grant select on table public.incidents to authenticated;
grant select on table public.incident_updates to authenticated;
grant select on table public.status_pages to anon, authenticated;
grant select on table public.status_page_components to anon, authenticated;
grant select on table public.maintenance_windows to authenticated;
grant select on table public.contact_lists to authenticated;
grant select on table public.contacts to authenticated;
grant select on table public.notification_rules to authenticated;
grant select on table public.audit_events to authenticated;
grant select on table public.billing_orders to authenticated;
grant select on table public.referrals to authenticated;
grant select on table public.support_tickets to authenticated;

grant select, insert, update, delete on table public.monitors to service_role;
grant select, insert, update, delete on table public.monitor_tokens to service_role;
grant select, insert, update, delete on table public.check_results to service_role;
grant select, insert, update, delete on table public.check_rollups to service_role;
grant select, insert, update, delete on table public.incidents to service_role;
grant select, insert, update, delete on table public.incident_updates to service_role;
grant select, insert, update, delete on table public.status_pages to service_role;
grant select, insert, update, delete on table public.status_page_components to service_role;
grant select, insert, update, delete on table public.status_subscribers to service_role;
grant select, insert, update, delete on table public.maintenance_windows to service_role;
grant select, insert, update, delete on table public.contact_lists to service_role;
grant select, insert, update, delete on table public.contacts to service_role;
grant select, insert, update, delete on table public.notification_rules to service_role;
grant select, insert, update, delete on table public.notification_deliveries to service_role;
grant select, insert on table public.audit_events to service_role;
grant select, insert, update, delete on table public.billing_orders to service_role;
grant select, insert, update, delete on table public.referrals to service_role;
grant select, insert, update, delete on table public.support_tickets to service_role;

create policy monitors_select_member
on public.monitors
for select
to authenticated
using (private.is_org_member(organization_id));

create policy incidents_select_member
on public.incidents
for select
to authenticated
using (private.is_org_member(organization_id));

create policy incident_updates_select_member
on public.incident_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.incidents as incidents
    where incidents.id = incident_id
      and private.is_org_member(incidents.organization_id)
  )
);

create policy status_pages_select_visible
on public.status_pages
for select
to anon, authenticated
using (
  visibility in ('public', 'unlisted')
  or private.is_org_member(organization_id)
);

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
        pages.visibility in ('public', 'unlisted')
        or private.is_org_member(pages.organization_id)
      )
  )
);

create policy maintenance_windows_select_member
on public.maintenance_windows
for select
to authenticated
using (private.is_org_member(organization_id));

create policy contact_lists_select_member
on public.contact_lists
for select
to authenticated
using (private.is_org_member(organization_id));

create policy contacts_select_member
on public.contacts
for select
to authenticated
using (private.is_org_member(organization_id));

create policy notification_rules_select_member
on public.notification_rules
for select
to authenticated
using (private.is_org_member(organization_id));

create policy audit_events_select_member
on public.audit_events
for select
to authenticated
using (private.is_org_member(organization_id));

create policy billing_orders_select_member
on public.billing_orders
for select
to authenticated
using (private.is_org_member(organization_id));

create policy referrals_select_member
on public.referrals
for select
to authenticated
using (
  private.is_org_member(referrer_organization_id)
  or private.is_org_member(referred_organization_id)
);

create policy support_tickets_select_own
on public.support_tickets
for select
to authenticated
using (
  user_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

revoke all on function private.random_referral_code() from public, anon, authenticated;
revoke all on function private.organizations_fill_referral_code() from public, anon, authenticated;
grant execute on function private.random_referral_code() to postgres;
grant execute on function private.organizations_fill_referral_code() to postgres;

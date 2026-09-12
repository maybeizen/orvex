grant delete on table public.organizations to authenticated;

create policy organizations_delete_owner
on public.organizations
for delete
to authenticated
using (private.org_role(id) = 'owner');

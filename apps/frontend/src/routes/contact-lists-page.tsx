import { RequireSession } from "@/components/auth/require-session";
import { ContactListsView } from "@/components/contacts/contact-lists-view";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function ContactListsPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <RequireSession
      title="Contact Lists"
      description="Sign in to manage who gets paged."
    >
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ContactListsView organization={organization} />
      )}
    </RequireSession>
  );
}

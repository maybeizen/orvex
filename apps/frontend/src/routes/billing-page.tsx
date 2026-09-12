import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { RequireSession } from "@/components/auth/require-session";
import { PageHeader } from "@/components/console/page-header";
import { BillingSettings } from "@/components/settings/billing-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { hydrateOrganizations } from "@/lib/post-auth";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function BillingPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);
  const [searchParams, setSearchParams] = useSearchParams();
  const handledCheckout = useRef<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout !== "success" && checkout !== "cancel") {
      return;
    }
    if (handledCheckout.current === checkout) {
      return;
    }
    handledCheckout.current = checkout;
    const next = new URLSearchParams(searchParams);
    next.delete("checkout");
    setSearchParams(next, { replace: true });
    if (checkout === "cancel") {
      toast.message("Checkout canceled");
      return;
    }
    void hydrateOrganizations()
      .then(() => {
        toast.success("Checkout complete. Plan status refreshed.");
      })
      .catch((caught: unknown) => {
        toast.error(
          caught instanceof Error
            ? caught.message
            : "Unable to refresh billing status",
        );
      });
  }, [searchParams, setSearchParams]);

  return (
    <RequireSession
      title="Billing"
      description="Sign in to review the workspace plan."
    >
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Billing"
          title="Billing"
          description="Plan limits and invoices for this organization."
        />
        {orgStatus !== "ready" || organization === null ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <BillingSettings organization={organization} />
        )}
      </div>
    </RequireSession>
  );
}

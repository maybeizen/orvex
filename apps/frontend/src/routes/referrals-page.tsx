import { useEffect, useState } from "react";
import type { ReferralProgram } from "@orvex/types";
import { RequireSession } from "@/components/auth/require-session";
import {
  formatLedgerDate,
  referralStatusLabel,
} from "@/components/billing/format";
import { queryReferralProgram } from "@/components/billing/client";
import { ReferralShareDialog } from "@/components/billing/referral-share-dialog";
import {
  ConsolePanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function ReferralsPage() {
  const organization = useOrgStore(selectActiveOrganization);
  const organizationId = organization?.id;
  const [program, setProgram] = useState<ReferralProgram | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (organizationId === undefined) {
      return;
    }
    let active = true;
    void queryReferralProgram(organizationId)
      .then((next) => {
        if (active) {
          setProgram(next);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load referrals",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  return (
    <RequireSession
      title="Referrals"
      description="Sign in to review referrals."
    >
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Billing"
          title="Referrals"
          description={
            organization === null
              ? "Share a seat credit when another desk starts paying."
              : `Share a seat credit from ${organization.name}.`
          }
          actions={
            program === null ? undefined : (
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  setShareOpen(true);
                }}
              >
                Share link
              </Button>
            )
          }
        />
        {error !== null ? (
          <ConsolePanel padded={false}>
            <ErrorPanel title="Unable to load referrals" body={error} />
          </ConsolePanel>
        ) : program === null ? (
          <ConsolePanel padded={false}>
            <LoadingPanel />
          </ConsolePanel>
        ) : (
          <>
            <ConsolePanel
              title="Code"
              description="Give this path to another desk."
            >
              <p className="font-mono text-sm">{program.code}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {program.sharePath}
              </p>
            </ConsolePanel>
            <ConsolePanel padded={false} title="Ledger">
              {program.items.length === 0 ? (
                <EmptyPanel
                  title="No referrals yet"
                  body="Credits appear here when a desk starts paying with your link."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                        <th className="px-3 py-2.5 font-medium">Date</th>
                        <th className="px-3 py-2.5 font-medium">Referred</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {program.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-3 py-2.5">
                            {formatLedgerDate(item.createdAt)}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs">
                            {item.referredOrganizationId}
                          </td>
                          <td className="px-3 py-2.5">
                            {referralStatusLabel(item.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ConsolePanel>
          </>
        )}
        {program === null ? null : (
          <ReferralShareDialog
            open={shareOpen}
            sharePath={program.sharePath}
            onOpenChange={setShareOpen}
          />
        )}
      </div>
    </RequireSession>
  );
}

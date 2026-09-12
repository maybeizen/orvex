import { SignalPlaceholder } from "@/components/workspace/signal-placeholder";

export function ContactListsPage() {
  return (
    <SignalPlaceholder
      eyebrow="Routing"
      title="Contact Lists"
      description="Named lists for who gets paged when a check fails."
      emptyTitle="No contact lists yet"
      emptyBody="Lists will sit on the same incidents as Slack and email once routing is connected to the core."
    />
  );
}

export function WhiteLabelPage() {
  return (
    <SignalPlaceholder
      eyebrow="Status"
      title="White Label"
      description="Custom domain and chrome for the public status page."
      emptyTitle="White label is not armed"
      emptyBody="Command includes a custom domain. This desk will bind it here when status pages leave the catalog."
    />
  );
}

export function AuditLogPage() {
  return (
    <SignalPlaceholder
      eyebrow="Access"
      title="Audit Log"
      description="Who changed seats, monitors, and organization settings."
      emptyTitle="No audit events stored"
      emptyBody="Member and organization writes are live. A durable audit stream is not recording yet."
    />
  );
}

export function OrdersPage() {
  return (
    <SignalPlaceholder
      eyebrow="Billing"
      title="Orders"
      description="Plan changes and checkout sessions for this organization."
      emptyTitle="No orders on file"
      emptyBody="Paid plans still check out through onboarding. Orders will list here when Stripe is connected."
    />
  );
}

export function ReferralsPage() {
  return (
    <SignalPlaceholder
      eyebrow="Billing"
      title="Referrals"
      description="Share a seat credit when another desk starts paying."
      emptyTitle="No referral program"
      emptyBody="There is no live referral ledger. Credits will appear here if the program is turned on."
    />
  );
}

export function SupportPage() {
  return (
    <SignalPlaceholder
      eyebrow="Help"
      title="Support"
      description="Reach the desk when something in the product is wrong."
      emptyTitle="No support inbox yet"
      emptyBody="There is no support mailbox on this deployment. Use Docs for product facts and Changelog for what shipped."
    />
  );
}

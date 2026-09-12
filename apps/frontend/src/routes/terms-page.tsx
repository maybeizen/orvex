import { Link } from "react-router";
import { AuthFooter } from "@/components/auth/auth-footer";
import { PublicChrome } from "@/components/auth/public-chrome";

const SECTIONS = [
  {
    title: "The service",
    body: "Orvex Monitor watches HTTP, TLS, keyword, heartbeat, and agent checks for the organization you create. Free and paid plans share the same product surface with different limits.",
  },
  {
    title: "Accounts and workspaces",
    body: "You must keep credentials, recovery codes, and memberships under your control. A Single organization cannot add members. A Team organization cannot exceed the seat limit of its plan.",
  },
  {
    title: "Acceptable use",
    body: "Do not use Orvex to attack, scrape without permission, or overwhelm targets you do not operate. We may suspend checks that threaten the probe network or other customers.",
  },
  {
    title: "Billing",
    body: "Paid plans will be billed through Stripe in a later release. Until checkout is live, a paid workspace may exist with a pending checkout status and can still be used for setup.",
  },
  {
    title: "Availability",
    body: "We aim for a quiet control room, not a contractual SLA on Free. Probe data can be delayed, incomplete, or wrong. Do not rely on Orvex as the only page-out for life-safety systems.",
  },
  {
    title: "Liability",
    body: "The product is provided as-is. Orvex is not liable for lost profits, missed incidents, or downstream outages. These terms are governed by the law of the operator’s principal place of business.",
  },
] as const;

export function TermsPage() {
  return (
    <PublicChrome align="start" width="document">
      <div className="flex flex-col gap-10 pb-16">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Legal
          </p>
          <h1 className="font-display text-[2.25rem] leading-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated 23 August 2026. Creating an organization means you
            accept these terms for that workspace.
          </p>
        </div>
        <div className="flex flex-col gap-8">
          {SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h2 className="text-base font-medium tracking-tight">
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {section.body}
              </p>
            </section>
          ))}
        </div>
        <AuthFooter>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              className="text-foreground underline-offset-4 hover:underline"
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </AuthFooter>
      </div>
    </PublicChrome>
  );
}

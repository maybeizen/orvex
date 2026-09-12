import { Link } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { ConsolePanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { useOrgLink } from "@/lib/use-org-link";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3001";
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-pretty whitespace-pre-wrap">
      {children}
    </pre>
  );
}

export function DocsPage() {
  const orgLink = useOrgLink();
  const organization = useOrgStore(selectActiveOrganization);
  const apiUrl = apiBase();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const pageSlug = organization?.slug ?? "your-page";
  const topics = [
    {
      title: "Uptime monitors",
      body: "Point HTTP, TLS, keyword, heartbeat, or agent checks at systems you operate. The desk stores the configuration; the probe core is still being wired.",
      to: orgLink("/monitors"),
      label: "Open monitors",
    },
    {
      title: "Incidents",
      body: "A failing check opens a timeline. Routing and acknowledgements will use the same events as the status page.",
      to: orgLink("/incidents"),
      label: "Open incidents",
    },
    {
      title: "Status pages",
      body: "Public pages publish from the same incident stream. White label binds a custom domain on Command.",
      to: orgLink("/status-pages"),
      label: "Open status pages",
    },
    {
      title: "Team members",
      body: "Team organizations can invite admins and members up to the plan seat limit. Single organizations stay at one seat.",
      to: orgLink("/team"),
      label: "Open team members",
    },
    {
      title: "Organization settings",
      body: "Name, slug, and icon live on the organization. Profile, appearance, and sign-out stay in the avatar menu.",
      to: orgLink("/settings"),
      label: "Open organization",
    },
  ] as const;

  return (
    <RequireSession
      title="Docs"
      description="Sign in to read the product docs."
    >
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Help"
          title="Docs"
          description="What this desk does today. There is no separate documentation site."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {topics.map((topic) => (
            <ConsolePanel key={topic.title} title={topic.title}>
              <p className="text-sm text-muted-foreground text-pretty">
                {topic.body}
              </p>
              <Link
                to={topic.to}
                className="mt-3 inline-flex text-sm text-primary underline-offset-4 hover:underline"
              >
                {topic.label}
              </Link>
            </ConsolePanel>
          ))}
        </div>
        <ConsolePanel title="Install the agent">
          <p className="text-sm text-muted-foreground text-pretty">
            The host agent sends periodic heartbeats for agent and heartbeat
            monitors. Install writes agent.yml plus a systemd unit and cron
            snippet.
          </p>
          <CodeBlock>{`go run ./cmd/agent install -token "$TOKEN" -id "$AGENT_ID" -api-url ${apiUrl}
go run ./cmd/agent`}</CodeBlock>
        </ConsolePanel>
        <ConsolePanel title="Install a probe">
          <p className="text-sm text-muted-foreground text-pretty">
            Regional probes claim HTTP, keyword, port, and ping checks. Allowed
            regions are IAD, SJC, LHR, FRA, SIN, and SYD.
          </p>
          <CodeBlock>{`export API_URL=${apiUrl}
export PROBE_SERVICE_TOKEN="$PROBE_SERVICE_TOKEN"
export PROBE_REGION=IAD
./orvex-probe`}</CodeBlock>
        </ConsolePanel>
        <ConsolePanel title="Heartbeat curl">
          <p className="text-sm text-muted-foreground text-pretty">
            POST /agent/heartbeat with a Bearer monitor token. Success is 204.
            Missing or unknown tokens return 401.
          </p>
          <CodeBlock>{`curl -X POST "${apiUrl}/agent/heartbeat" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"$MONITOR_ID","version":"1.0","hostname":"box-1","metrics":{"cpu":0.12}}'`}</CodeBlock>
        </ConsolePanel>
        <ConsolePanel title="Public status URL">
          <p className="text-sm text-muted-foreground text-pretty">
            Each status page is public at /s/:pageSlug. Use the page slug, not
            the organization slug, unless they match.
          </p>
          <CodeBlock>{`${origin}/s/${pageSlug}`}</CodeBlock>
        </ConsolePanel>
      </div>
    </RequireSession>
  );
}

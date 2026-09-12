import { Link } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import { ConsolePanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";

const TOPICS = [
  {
    title: "Uptime monitors",
    body: "Point HTTP, TLS, keyword, heartbeat, or agent checks at systems you operate. The desk stores the configuration; the probe core is still being wired.",
    to: "/monitors",
    label: "Open monitors",
  },
  {
    title: "Incidents",
    body: "A failing check opens a timeline. Routing and acknowledgements will use the same events as the status page.",
    to: "/incidents",
    label: "Open incidents",
  },
  {
    title: "Status pages",
    body: "Public pages publish from the same incident stream. White label binds a custom domain on Command.",
    to: "/status-pages",
    label: "Open status pages",
  },
  {
    title: "Team members",
    body: "Team organizations can invite admins and members up to the plan seat limit. Single organizations stay at one seat.",
    to: "/team",
    label: "Open team members",
  },
  {
    title: "Organization settings",
    body: "Name, slug, and icon live on the organization. Profile, appearance, and sign-out stay in the avatar menu.",
    to: "/settings/organization",
    label: "Open organization",
  },
] as const;

export function DocsPage() {
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
          {TOPICS.map((topic) => (
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
      </div>
    </RequireSession>
  );
}

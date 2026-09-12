import { Link } from "react-router";
import { ErrorPanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { useOrgLink } from "@/lib/use-org-link";

export function StatusPageMissing({ id }: { id: string }) {
  const orgLink = useOrgLink();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Public board"
        title="Status page not found"
        description="This page is not published on the workspace."
      />
      <ErrorPanel
        title={`${id} is not a status page`}
        body="No page with that id is stored on this organization."
        action={
          <Button asChild size="sm">
            <Link to={orgLink("/status-pages")}>Back to status pages</Link>
          </Button>
        }
      />
    </div>
  );
}

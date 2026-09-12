import { RequireSession } from "@/components/auth/require-session";
import { ConsolePanel, EmptyPanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";

export function SignalPlaceholder({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyBody,
}: {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  return (
    <RequireSession
      title={title}
      description={`Sign in to open ${title.toLowerCase()}.`}
    >
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        <ConsolePanel padded={false}>
          <EmptyPanel title={emptyTitle} body={emptyBody} />
        </ConsolePanel>
      </div>
    </RequireSession>
  );
}

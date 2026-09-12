import { useParams } from "react-router";
import { RequireSession } from "@/components/auth/require-session";
import {
  StatusPageDetail,
  StatusPageMissing,
} from "@/components/status-pages/status-page-board";
import { findStatusPage } from "@/lib/console";

export function StatusPageDetailPage() {
  const { pageId } = useParams();
  const page = pageId === undefined ? undefined : findStatusPage(pageId);

  return (
    <RequireSession
      title="Status page"
      description="Sign in to see this status page."
    >
      {page === undefined ? (
        <StatusPageMissing id={pageId ?? "unknown"} />
      ) : (
        <StatusPageDetail page={page} />
      )}
    </RequireSession>
  );
}

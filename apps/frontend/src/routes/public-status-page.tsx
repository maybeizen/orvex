import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useParams, useSearchParams } from "react-router";
import {
  PublicStatusBoard,
  PublicStatusMissing,
} from "@/components/status/public-status-board";
import { statusPageApi } from "@/components/status/status-api";
import {
  faultMessage,
  isNotFound,
  type StatusPagePublicPayload,
} from "@/components/status/status-helpers";
import { SkipLink } from "@/components/skip-link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDocumentTitle } from "@/lib/document-title";

type ConfirmNote = {
  tone: "status" | "alert";
  text: string;
};

function ConfirmLine({ note }: { note: ConfirmNote | null }) {
  if (note === null) {
    return null;
  }
  return (
    <p
      role={note.tone}
      className="max-w-sm px-5 text-center text-sm text-foreground"
    >
      {note.text}
    </p>
  );
}

function StatusFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <SkipLink />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-svh flex-col items-center justify-center"
      >
        {children}
      </main>
    </div>
  );
}

export function StatusConfirmRedirect() {
  const { pageSlug, orgSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const params = new URLSearchParams();
  if (token.length > 0) {
    params.set("confirm", token);
  }
  if (orgSlug !== undefined && orgSlug.length > 0) {
    params.set("org", orgSlug);
  }
  const query = params.toString();
  return (
    <Navigate
      to={`/s/${pageSlug ?? ""}${query.length > 0 ? `?${query}` : ""}`}
      replace
    />
  );
}

export function PublicStatusPage() {
  const { pageSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  const confirmToken = searchParams.get("confirm");
  const organizationSlug = searchParams.get("org") ?? undefined;
  const [payload, setPayload] = useState<StatusPagePublicPayload | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState<ConfirmNote | null>(null);

  useEffect(() => {
    if (pageSlug === undefined || pageSlug.length === 0) {
      return;
    }
    let active = true;
    const input: {
      pageSlug: string;
      organizationSlug?: string;
      token?: string;
    } = { pageSlug };
    if (organizationSlug !== undefined) {
      input.organizationSlug = organizationSlug;
    }
    if (token !== undefined && token.length > 0) {
      input.token = token;
    }
    void statusPageApi()
      .publicGet.query(input)
      .then((next) => {
        if (active) {
          setPayload(next);
          setMissing(false);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!active) {
          return;
        }
        if (isNotFound(caught)) {
          setMissing(true);
          return;
        }
        setError(
          faultMessage(
            caught,
            "The status service did not respond. Try again in a moment.",
          ),
        );
      });
    return () => {
      active = false;
    };
  }, [pageSlug, organizationSlug, token]);

  useEffect(() => {
    if (missing) {
      document.title = formatDocumentTitle("Status page not found");
      return;
    }
    if (error !== null) {
      document.title = formatDocumentTitle("Unable to load status page");
      return;
    }
    if (payload !== null) {
      document.title = formatDocumentTitle(payload.page.name);
    }
  }, [error, missing, payload]);

  useEffect(() => {
    if (confirmToken === null || confirmToken.length === 0) {
      return;
    }
    let active = true;
    void statusPageApi()
      .confirmSubscriber.mutate({ token: confirmToken })
      .then(() => {
        if (active) {
          setConfirmNote({
            tone: "status",
            text: "Subscription confirmed.",
          });
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setConfirmNote({
            tone: "alert",
            text: faultMessage(caught, "Unable to confirm this subscription"),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [confirmToken]);

  if (pageSlug === undefined || pageSlug.length === 0 || missing) {
    return (
      <StatusFrame>
        <ConfirmLine note={confirmNote} />
        <PublicStatusMissing />
      </StatusFrame>
    );
  }

  if (error !== null) {
    return (
      <StatusFrame>
        <div
          role="alert"
          className="flex max-w-sm flex-col items-center px-5 text-center"
        >
          <h1 className="font-heading text-xl">Unable to load status page</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
        <ConfirmLine note={confirmNote} />
      </StatusFrame>
    );
  }

  if (payload === null) {
    return (
      <StatusFrame>
        <ConfirmLine note={confirmNote} />
        <div
          role="status"
          aria-live="polite"
          className="flex w-full max-w-2xl flex-col gap-3 px-5 py-8"
        >
          <span className="sr-only">Loading status</span>
          <Skeleton className="h-8 w-40" aria-hidden />
          <Skeleton className="h-24 w-full" aria-hidden />
          <Skeleton className="h-40 w-full" aria-hidden />
        </div>
      </StatusFrame>
    );
  }

  return (
    <PublicStatusBoard
      payload={payload}
      organizationSlug={organizationSlug}
      token={token}
      confirmNote={confirmNote}
    />
  );
}

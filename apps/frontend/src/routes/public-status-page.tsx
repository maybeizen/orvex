import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

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
  const [confirmNote, setConfirmNote] = useState<string | null>(null);

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
        setError(faultMessage(caught, "Unable to load status page"));
      });
    return () => {
      active = false;
    };
  }, [pageSlug, organizationSlug, token]);

  useEffect(() => {
    if (confirmToken === null || confirmToken.length === 0) {
      return;
    }
    let active = true;
    void statusPageApi()
      .confirmSubscriber.mutate({ token: confirmToken })
      .then(() => {
        if (active) {
          setConfirmNote("Subscription confirmed.");
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setConfirmNote(
            faultMessage(caught, "Unable to confirm this subscription"),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [confirmToken]);

  if (pageSlug === undefined || pageSlug.length === 0 || missing) {
    return <PublicStatusMissing />;
  }

  if (error !== null) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 bg-background px-5">
        <h1 className="font-heading text-xl">Unable to load status page</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {error}
        </p>
      </div>
    );
  }

  if (payload === null) {
    return (
      <div className="flex min-h-svh flex-col gap-3 bg-background px-5 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      {confirmNote === null ? null : (
        <p className="bg-muted px-5 py-2 text-center text-sm text-foreground">
          {confirmNote}
        </p>
      )}
      <PublicStatusBoard
        payload={payload}
        organizationSlug={organizationSlug}
        token={token}
      />
    </div>
  );
}

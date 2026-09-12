import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
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

export function PublicStatusPage() {
  const { pageSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  const organizationSlug = searchParams.get("org") ?? undefined;
  const [payload, setPayload] = useState<StatusPagePublicPayload | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <PublicStatusBoard
      payload={payload}
      organizationSlug={organizationSlug}
      token={token}
    />
  );
}

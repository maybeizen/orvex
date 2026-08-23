import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionStore } from "@/stores/session-store";

export function RequireSession({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const user = useSessionStore((state) => state.user);
  const status = useSessionStore((state) => state.status);

  if (status === "loading") {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button asChild className="w-fit">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return children;
}

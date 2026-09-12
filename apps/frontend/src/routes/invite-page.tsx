import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PublicChrome } from "@/components/auth/public-chrome";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { pathAfterAuth } from "@/lib/post-auth";
import { useSessionStore } from "@/stores/session-store";

type Preview = {
  organizationName: string;
  email: string;
  role: "admin" | "member";
  expired: boolean;
};

export function InvitePage() {
  const token = useParams().token ?? "";
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const status = useSessionStore((state) => state.status);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    if (token.length === 0) {
      return;
    }
    void createVanillaTrpcClient()
      .organization.invites.preview.query({ token })
      .then((next) => {
        if (active) {
          setPreview(next);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Invite not found",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function accept() {
    setPending(true);
    try {
      await createVanillaTrpcClient().organization.invites.accept.mutate({
        token,
      });
      toast.success("You joined the organization");
      void navigate(await pathAfterAuth("/team"));
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to accept invite",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PublicChrome>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-16">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Invite
          </p>
          <h1 className="font-heading text-2xl tracking-tight">
            Join an organization
          </h1>
        </div>
        {token.length === 0 || error !== null ? (
          <p className="text-sm text-muted-foreground">
            {error ?? "Invite not found"}
          </p>
        ) : preview === null || status === "loading" ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              {preview.organizationName} invited {preview.email} as{" "}
              {preview.role}.
            </p>
            {preview.expired ? (
              <p className="text-sm text-destructive">
                This invite has expired.
              </p>
            ) : user === null ? (
              <Button asChild className="w-fit">
                <Link to="/login">Sign in to accept</Link>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-fit"
                disabled={pending}
                onClick={() => {
                  void accept();
                }}
              >
                {pending ? "Joining" : "Accept invite"}
              </Button>
            )}
          </div>
        )}
      </main>
    </PublicChrome>
  );
}

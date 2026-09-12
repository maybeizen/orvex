import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { RequireSession } from "@/components/auth/require-session";
import { ConsolePanel } from "@/components/console/console-panel";
import { PageHeader } from "@/components/console/page-header";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { createAccessClient } from "@/components/access/access-client";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function SupportPage() {
  const orgStatus = useOrgStore((state) => state.status);
  const organization = useOrgStore(selectActiveOrganization);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(): Promise<void> {
    if (organization === null) {
      return;
    }
    setPending(true);
    try {
      const created = await createAccessClient().support.create.mutate({
        organizationId: organization.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      if (created.status === "sent") {
        toast.success("Message sent");
      } else {
        toast.success("Ticket opened");
      }
      setSubject("");
      setBody("");
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to open a ticket",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <RequireSession title="Support" description="Sign in to reach the desk.">
      {orgStatus !== "ready" || organization === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="flex flex-col gap-4">
          <PageHeader
            eyebrow="Help"
            title="Support"
            description={`Reach the desk when something in ${organization.name} is wrong.`}
          />
          <ConsolePanel title="New ticket">
            <form
              className="flex flex-col gap-4"
              onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
                event.preventDefault();
                void submit();
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="support-subject">Subject</FieldLabel>
                  <Input
                    id="support-subject"
                    required
                    maxLength={200}
                    value={subject}
                    onChange={(event) => {
                      setSubject(event.target.value);
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="support-body">Body</FieldLabel>
                  <textarea
                    id="support-body"
                    required
                    rows={8}
                    maxLength={8000}
                    value={body}
                    onChange={(event) => {
                      setBody(event.target.value);
                    }}
                    className={cn(
                      "min-h-32 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 ease-out outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
                    )}
                  />
                </Field>
              </FieldGroup>
              <div>
                <Button type="submit" disabled={pending}>
                  {pending ? <Spinner data-icon="inline-start" /> : null}
                  {pending ? "Sending" : "Send ticket"}
                </Button>
              </div>
            </form>
          </ConsolePanel>
        </div>
      )}
    </RequireSession>
  );
}

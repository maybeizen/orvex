import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { Organization, StatusPage } from "@orvex/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { Spinner } from "@/components/ui/spinner";
import { statusPageApi } from "./status-api";
import {
  copyText,
  faultMessage,
  isPageSlug,
  pageSlugFromName,
  pageSlugHint,
  publicStatusPath,
  VISIBILITY_OPTIONS,
} from "./status-helpers";

type Visibility = (typeof VISIBILITY_OPTIONS)[number]["value"];

export function CreateStatusPageDialog({
  open,
  organization,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  organization: Organization;
  onOpenChange: (open: boolean) => void;
  onCreated: (page: StatusPage, unlistedToken: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [pending, setPending] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const hint = pageSlugHint(slug);

  function reset() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setVisibility("public");
    setPending(false);
    setIssuedToken(null);
    setCreatedSlug(null);
  }

  function close() {
    if (pending) {
      return;
    }
    onOpenChange(false);
    reset();
  }

  async function submit() {
    if (!isPageSlug(slug)) {
      toast.error("Fix the page slug");
      return;
    }
    setPending(true);
    try {
      const created = await statusPageApi().create.mutate({
        organizationId: organization.id,
        name: name.trim(),
        slug,
        visibility,
      });
      onCreated(created.page, created.unlistedToken);
      if (created.unlistedToken !== null) {
        setIssuedToken(created.unlistedToken);
        setCreatedSlug(created.page.slug);
        toast.success("Status page published. Copy the unlisted token now.");
      } else {
        toast.success("Status page published");
        onOpenChange(false);
        reset();
      }
    } catch (error: unknown) {
      toast.error(faultMessage(error, "Unable to publish status page"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {issuedToken === null ? "Create status page" : "Unlisted token"}
          </DialogTitle>
          <DialogDescription>
            {issuedToken === null
              ? "Publish a board visitors can open without signing in."
              : "This token is shown once. Share it with the unlisted URL."}
          </DialogDescription>
        </DialogHeader>
        {issuedToken === null || createdSlug === null ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
              event.preventDefault();
              void submit();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="status-page-name">Name</FieldLabel>
                <Input
                  id="status-page-name"
                  required
                  value={name}
                  onChange={(event) => {
                    const next = event.target.value;
                    setName(next);
                    if (!slugTouched) {
                      setSlug(pageSlugFromName(next));
                    }
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status-page-slug">Slug</FieldLabel>
                <Input
                  id="status-page-slug"
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value.toLowerCase());
                  }}
                />
                {hint === null ? null : (
                  <FieldDescription>{hint}</FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="status-page-visibility">
                  Visibility
                </FieldLabel>
                <SelectMenu
                  id="status-page-visibility"
                  value={visibility}
                  onValueChange={setVisibility}
                  options={VISIBILITY_OPTIONS}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Publishing" : "Publish page"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="break-all font-mono text-xs text-foreground">
              {publicStatusPath(createdSlug, {
                organizationSlug: organization.slug,
                token: issuedToken,
              })}
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void copyText(issuedToken).then((ok) => {
                    toast[ok ? "success" : "error"](
                      ok ? "Token copied" : "Unable to copy",
                    );
                  });
                }}
              >
                Copy token
              </Button>
              <Button type="button" onClick={close}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

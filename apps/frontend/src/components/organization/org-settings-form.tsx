import { Camera } from "lucide-react";
import { useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { Organization } from "@orvex/types";
import { ImageCropDialog } from "@/components/onboarding/image-crop-dialog";
import { OrgAvatar, orgPlanLabel } from "@/components/organization/org-avatar";
import { SettingsBlock } from "@/components/account/settings-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isAllowedAvatarFile } from "@/lib/crop-image";
import { uploadOrganizationIcon } from "@/lib/org-icon-api";
import {
  isValidOrgSlug,
  slugFromName,
  slugHint,
} from "@/lib/organization-slug";
import { organizationPath } from "@/lib/org-paths";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { useOrgStore } from "@/stores/org-store";
import { useNavigate } from "react-router";

export function OrgSettingsForm({
  organization,
}: {
  organization: Organization;
}) {
  const navigate = useNavigate();
  const canManage =
    organization.role === "owner" || organization.role === "admin";
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [slugTouched, setSlugTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [iconPending, setIconPending] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hint = slugHint(slug);
  const invalid = hint !== null;

  function closeCrop() {
    if (cropSrc !== null) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) {
      return;
    }
    if (!isAllowedAvatarFile(file)) {
      toast.error("Use a JPEG, PNG, or WebP image");
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  }

  async function save() {
    if (!isValidOrgSlug(slug)) {
      toast.error("Fix the organization slug");
      return;
    }
    setPending(true);
    try {
      const next = await createVanillaTrpcClient().organization.update.mutate({
        organizationId: organization.id,
        organizationSlug: organization.slug,
        name: name.trim(),
        slug,
      });
      useOrgStore.getState().upsert(next);
      toast.success("Organization saved");
      if (next.slug !== organization.slug) {
        void navigate(organizationPath(next.slug, "/settings"), {
          replace: true,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save organization";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void save();
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsBlock
        title="Identity"
        description="Name and slug for this organization. Monitors and members stay attached to the same id."
      >
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0">
              <OrgAvatar
                name={name}
                iconUrl={organization.iconUrl}
                className="size-16 text-base"
              />
              {canManage ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  className="absolute right-0 bottom-0 rounded-full"
                  aria-label="Upload organization icon"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera />
                </Button>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono uppercase">
                  {orgPlanLabel(organization.planId)}
                </Badge>
                <Badge variant="secondary" className="font-mono uppercase">
                  {organization.kind === "single" ? "Single" : "Team"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {organization.kind === "single"
                  ? "This desk cannot invite anyone."
                  : "Seats are limited by the current plan."}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFile}
            />
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">Name</FieldLabel>
              <Input
                id="org-name"
                required
                maxLength={80}
                disabled={!canManage}
                value={name}
                onChange={(event) => {
                  const next = event.target.value;
                  setName(next);
                  if (!slugTouched) {
                    setSlug(slugFromName(next));
                  }
                }}
              />
            </Field>
            <Field data-invalid={invalid && slug.length > 0}>
              <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
              <Input
                id="org-slug"
                required
                disabled={!canManage}
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value.toLowerCase());
                }}
              />
              <FieldDescription>
                {hint ?? "Used in invite links and support context."}
              </FieldDescription>
            </Field>
          </FieldGroup>
          {canManage ? (
            <div>
              <Button type="submit" disabled={pending || invalid}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Saving" : "Save organization"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only owners and admins can change organization settings.
            </p>
          )}
        </form>
      </SettingsBlock>
      <ImageCropDialog
        imageSrc={cropSrc}
        title="Organization icon"
        description="Square crop. Saved as WebP."
        confirmLabel="Save icon"
        pending={iconPending}
        onClose={closeCrop}
        onConfirm={async (blob) => {
          setIconPending(true);
          try {
            const next = await uploadOrganizationIcon(organization.id, blob);
            useOrgStore.getState().upsert(next);
            toast.success("Icon saved");
            closeCrop();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unable to upload icon";
            toast.error(message);
          } finally {
            setIconPending(false);
          }
        }}
      />
    </div>
  );
}

import { Camera } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/onboarding/image-crop-dialog";
import { OrgAvatar } from "@/components/organization/org-avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isAllowedAvatarFile } from "@/lib/crop-image";
import { slugHint } from "@/lib/organization-slug";
import type { OnboardingDraft } from "./draft";

export function IdentityStep({
  draft,
  onChange,
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const hint = slugHint(draft.slug);
  const invalid = hint !== null && draft.slug.length > 0;

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

  function closeCrop() {
    if (cropSrc !== null) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0">
          <OrgAvatar
            name={draft.name}
            iconUrl={draft.iconObjectUrl}
            className="size-16 text-base"
          />
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
        </div>
        <p className="text-sm text-muted-foreground text-pretty">
          This is the workspace monitors and members live in. An icon is
          optional — we fall back to initials.
        </p>
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
          <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
          <Input
            id="org-name"
            value={draft.name}
            autoComplete="organization"
            onChange={(event) => {
              onChange({ name: event.target.value });
            }}
          />
        </Field>
        <Field data-invalid={invalid ? true : undefined}>
          <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
          <Input
            id="org-slug"
            value={draft.slug}
            aria-invalid={invalid}
            onChange={(event) => {
              onChange({
                slug: event.target.value.trim().toLowerCase(),
                slugTouched: true,
              });
            }}
          />
          <FieldDescription>
            {hint ?? `orvex.app/${draft.slug}`}
          </FieldDescription>
        </Field>
      </FieldGroup>
      <ImageCropDialog
        imageSrc={cropSrc}
        title="Crop organization icon"
        description="Drag to frame the mark. We store a square WebP after you create the workspace."
        confirmLabel="Use icon"
        onClose={closeCrop}
        onConfirm={(blob) => {
          if (draft.iconObjectUrl !== null) {
            URL.revokeObjectURL(draft.iconObjectUrl);
          }
          onChange({
            iconBlob: blob,
            iconObjectUrl: URL.createObjectURL(blob),
          });
          return Promise.resolve();
        }}
      />
    </div>
  );
}

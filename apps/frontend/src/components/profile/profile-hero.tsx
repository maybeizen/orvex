import { Camera } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { AvatarCropDialog } from "@/components/profile/avatar-crop-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { removeAvatar, useGravatarAvatar } from "@/lib/avatar-api";
import { isAllowedAvatarFile } from "@/lib/crop-image";
import { applyProfileToSession } from "@/lib/session-profile";
import { userInitials } from "@/lib/user-display";
import { useSessionStore } from "@/stores/session-store";

export function ProfileHero() {
  const user = useSessionStore((state) => state.user);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user === null) {
    return null;
  }

  const handle = user.username === null ? null : `@${user.username}`;

  function pickFile() {
    fileRef.current?.click();
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

  function closeCrop() {
    if (cropSrc !== null) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
  }

  async function gravatar() {
    setPending(true);
    try {
      const profile = await useGravatarAvatar();
      applyProfileToSession(profile);
      toast.success("Using your Gravatar");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No Gravatar for this email";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      const profile = await removeAvatar();
      applyProfileToSession(profile);
      toast.success("Photo removed");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to remove photo";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_70%)]" />
      <div className="relative flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end sm:gap-6">
        <div className="relative size-24 shrink-0">
          <Avatar className="size-24 text-lg ring-4 ring-background">
            {user.avatarUrl === null ? null : (
              <AvatarImage src={user.avatarUrl} alt="" />
            )}
            <AvatarFallback className="text-lg">
              {userInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-0 bottom-0 rounded-full"
            aria-label="Change photo"
            disabled={pending}
            onClick={pickFile}
          >
            <Camera />
          </Button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-heading truncate text-2xl tracking-tight">
              {user.displayName}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {handle === null ? user.email : `${handle} · ${user.email}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={pickFile}
            >
              Upload photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                void gravatar();
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Use Gravatar
            </Button>
            {user.avatarUrl === null ? null : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  void remove();
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onFile}
      />
      <AvatarCropDialog imageSrc={cropSrc} onClose={closeCrop} />
    </div>
  );
}

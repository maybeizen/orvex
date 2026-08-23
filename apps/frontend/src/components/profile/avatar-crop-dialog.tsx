import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { uploadAvatar } from "@/lib/avatar-api";
import { cropImageToBlob, type CropPixels } from "@/lib/crop-image";
import { applyProfileToSession } from "@/lib/session-profile";

export function AvatarCropDialog({
  imageSrc,
  onClose,
}: {
  imageSrc: string | null;
  onClose: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropPixels | null>(null);
  const [pending, setPending] = useState(false);
  const open = imageSrc !== null;

  const onCropComplete = useCallback((_: Area, cropped: Area) => {
    setArea(cropped);
  }, []);

  async function save() {
    if (imageSrc === null || area === null) {
      toast.error("Adjust the crop before saving");
      return;
    }
    setPending(true);
    try {
      const blob = await cropImageToBlob(imageSrc, area);
      const profile = await uploadAvatar(blob);
      applyProfileToSession(profile);
      toast.success("Photo updated");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save photo";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop your photo</DialogTitle>
          <DialogDescription>
            Drag to frame your face. We store a square WebP on the server.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-72 overflow-hidden rounded-xl bg-muted">
          {imageSrc === null ? null : (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <Field>
          <FieldLabel htmlFor="avatar-zoom">Zoom</FieldLabel>
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            className="w-full accent-primary"
            onChange={(event) => {
              setZoom(Number(event.target.value));
            }}
          />
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || area === null}
            onClick={() => {
              void save();
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? "Saving" : "Save photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

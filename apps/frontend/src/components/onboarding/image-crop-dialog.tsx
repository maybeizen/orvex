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
import { cropImageToBlob, type CropPixels } from "@/lib/crop-image";

export function ImageCropDialog({
  imageSrc,
  title,
  description,
  confirmLabel,
  pending = false,
  onClose,
  onConfirm,
}: {
  imageSrc: string | null;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropPixels | null>(null);
  const [saving, setSaving] = useState(false);
  const open = imageSrc !== null;
  const busy = pending || saving;

  const onCropComplete = useCallback((_: Area, cropped: Area) => {
    setArea(cropped);
  }, []);

  async function save() {
    if (imageSrc === null || area === null) {
      toast.error("Adjust the crop before saving");
      return;
    }
    setSaving(true);
    try {
      const blob = await cropImageToBlob(imageSrc, area);
      await onConfirm(blob);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to crop image";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
          <FieldLabel htmlFor="org-icon-zoom">Zoom</FieldLabel>
          <input
            id="org-icon-zoom"
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
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || area === null}
            onClick={() => {
              void save();
            }}
          >
            {busy ? <Spinner data-icon="inline-start" /> : null}
            {busy ? "Saving" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

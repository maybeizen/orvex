import { useState } from "react";
import { toast } from "sonner";
import { referralShareUrl } from "@/components/billing/redirect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ReferralShareDialog({
  open,
  sharePath,
  onOpenChange,
}: {
  open: boolean;
  sharePath: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = referralShareUrl(sharePath);
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Referral link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  }

  async function shareLink(): Promise<void> {
    if (!canShare) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: "Join this desk",
        url,
      });
    } catch (caught: unknown) {
      if (caught instanceof Error && caught.name === "AbortError") {
        return;
      }
      await copyLink();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCopied(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share referral</DialogTitle>
          <DialogDescription>
            Send this link. When the other desk starts paying, credit lands on
            this organization.
          </DialogDescription>
        </DialogHeader>
        <Input
          readOnly
          aria-label="Referral link"
          value={url}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyLink()}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button type="button" onClick={() => void shareLink()}>
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

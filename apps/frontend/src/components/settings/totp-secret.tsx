import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function TotpSecret({ secret }: { secret: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success("Secret copied");
    } catch {
      toast.error("Unable to copy");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      <div className="group flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-lg border border-border bg-muted/60 pr-1 transition-shadow focus-within:ring-3 focus-within:ring-ring/50">
        <p
          id="totp-secret"
          tabIndex={0}
          className="min-w-0 flex-1 px-3 py-2 text-center font-mono text-xs tracking-wide break-all text-foreground blur-md transition-[filter] duration-200 select-none group-hover:blur-none group-hover:select-text group-focus-within:blur-none group-focus-within:select-text group-active:blur-none"
        >
          {secret}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Copy backup secret"
          onClick={() => {
            void copy();
          }}
        >
          <Copy />
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Hover to reveal. Copy this key if you cannot scan the QR code.
      </p>
    </div>
  );
}

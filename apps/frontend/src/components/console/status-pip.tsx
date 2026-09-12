import { cn } from "@/lib/cn";
import {
  CHECK_STATUS_LABEL,
  CHECK_STATUS_PIP,
  CHECK_STATUS_TEXT,
  type CheckStatus,
} from "@/lib/console";

export function StatusPip({
  status,
  className,
}: {
  status: CheckStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-[1px]",
        CHECK_STATUS_PIP[status],
        className,
      )}
      aria-hidden
    />
  );
}

export function StatusMark({
  status,
  withLabel = true,
  className,
}: {
  status: CheckStatus;
  withLabel?: boolean;
  className?: string;
}) {
  const label = CHECK_STATUS_LABEL[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase",
        CHECK_STATUS_TEXT[status],
        className,
      )}
    >
      <StatusPip status={status} />
      {withLabel ? (
        <span>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

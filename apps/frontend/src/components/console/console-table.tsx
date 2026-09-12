import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ConsoleColumn = {
  key: string;
  label: string;
  className?: string;
  hide?: "sm" | "md" | "lg";
};

const HIDE: Record<NonNullable<ConsoleColumn["hide"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function ConsoleTable({
  columns,
  children,
  className,
}: {
  columns: readonly ConsoleColumn[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 overflow-x-auto", className)}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-3 py-2 font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase",
                  column.hide === undefined ? null : HIDE[column.hide],
                  column.className,
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function ConsoleRow({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  if (href === undefined) {
    return (
      <tr className={cn("border-b border-border last:border-b-0", className)}>
        {children}
      </tr>
    );
  }

  return (
    <tr
      className={cn(
        "border-b border-border last:border-b-0 hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function ConsoleCell({
  children,
  className,
  hide,
  mono = false,
}: {
  children: ReactNode;
  className?: string;
  hide?: ConsoleColumn["hide"];
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 align-middle",
        mono && "font-mono text-[12px] tabular-nums",
        hide === undefined ? null : HIDE[hide],
        className,
      )}
    >
      {children}
    </td>
  );
}

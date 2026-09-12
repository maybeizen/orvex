import type { ReactNode } from "react";
import { AuthFooter } from "@/components/auth/auth-footer";
import { PublicChrome } from "@/components/auth/public-chrome";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <PublicChrome>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[2rem] leading-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {children}
        <AuthFooter>{footer}</AuthFooter>
      </div>
    </PublicChrome>
  );
}

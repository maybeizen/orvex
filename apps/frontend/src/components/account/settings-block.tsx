import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsBlock({
  framed = true,
  title,
  description,
  action,
  footer,
  children,
}: {
  framed?: boolean;
  title: string;
  description: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (!framed) {
    return (
      <section className="flex flex-col gap-5 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-heading text-base">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {action}
        </div>
        {children}
        {footer}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {action === undefined ? null : <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer === undefined ? null : <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

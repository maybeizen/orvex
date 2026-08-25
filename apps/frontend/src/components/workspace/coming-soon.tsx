import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Badge variant="outline" className="w-fit font-mono uppercase">
        Coming soon
      </Badge>
      <div>
        <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

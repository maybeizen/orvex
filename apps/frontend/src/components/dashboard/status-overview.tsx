import { lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const StatusChart = lazy(async () => {
  const module = await import("./status-chart");
  return { default: module.StatusChart };
});

function ChartFallback() {
  return <Skeleton className="h-[220px] w-full" />;
}

const cards = [
  { label: "Monitors up", value: "—", tone: "ok" as const },
  { label: "Incidents", value: "—", tone: "warn" as const },
  { label: "Agents", value: "—", tone: "neutral" as const },
] as const;

export function StatusOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={card.tone === "ok" ? "default" : "secondary"}>
                Scaffold
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Latency</CardTitle>
          <CardDescription>
            Placeholder series. Live checks come later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ChartFallback />}>
            <StatusChart />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

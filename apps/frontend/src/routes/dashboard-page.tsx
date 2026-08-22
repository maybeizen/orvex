import { StatusOverview } from "@/components/dashboard/status-overview";

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Placeholder status until monitors are wired.
        </p>
      </div>
      <StatusOverview />
    </div>
  );
}

import { INTEGRATIONS } from "@/lib/marketing/integrations";

function IntegrationRow() {
  return (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {INTEGRATIONS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.name}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Icon className="size-4" />
            <span className="font-mono text-sm tracking-wide uppercase">
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LandingIntegrations() {
  return (
    <section className="border-y border-border bg-card/40 py-12">
      <div className="mx-auto mb-8 max-w-6xl px-6">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Checks and destinations
        </p>
      </div>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max motion-safe:animate-[marketing-marquee_36s_linear_infinite] motion-reduce:animate-none">
          <IntegrationRow />
          <IntegrationRow />
        </div>
      </div>
    </section>
  );
}

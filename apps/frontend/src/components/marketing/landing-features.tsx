import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { FEATURES } from "@/lib/marketing/features";

export function LandingFeatures() {
  return (
    <MarketingSection id="features">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <SectionHeading
          eyebrow="Capabilities"
          title="The checks an on-call desk actually runs"
          copy="HTTP, TLS, keywords, heartbeats, routing, and a status page that shares the same events."
        />
        <ul className="divide-y divide-border border-y border-border">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[2rem_auto_minmax(0,1fr)] sm:gap-5"
              >
                <span className="hidden pt-0.5 font-mono text-[0.68rem] text-muted-foreground tabular-nums sm:block">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon className="mt-0.5 size-4 text-primary" />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h3 className="text-[0.95rem] font-medium tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                    {feature.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </MarketingSection>
  );
}

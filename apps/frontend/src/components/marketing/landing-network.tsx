import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { StatusDot } from "@/components/marketing/status-dot";
import { PROBE_SITES } from "@/lib/marketing/network";

export function LandingNetwork() {
  return (
    <MarketingSection id="network">
      <div className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Probe network"
          title="Checks from the edges"
          copy="The same request from six regions. You see which edge failed, not a blended average from one cloud AZ."
        />
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[36rem] text-left">
            <thead className="border-b border-border bg-muted/40">
              <tr className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-4 font-medium">Site</th>
                <th className="px-5 py-4 font-medium">City</th>
                <th className="px-5 py-4 font-medium">Region</th>
                <th className="px-5 py-4 font-medium">RTT</th>
                <th className="px-5 py-4 font-medium">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PROBE_SITES.map((site) => (
                <tr key={site.code}>
                  <td className="px-5 py-4 font-mono text-sm">{site.code}</td>
                  <td className="px-5 py-4 text-sm">{site.city}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {site.region}
                  </td>
                  <td className="px-5 py-4 font-mono text-sm tabular-nums">
                    {site.latencyMs}ms
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase">
                      <StatusDot tone={site.status} />
                      {site.status === "up" ? "Up" : "Degraded"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MarketingSection>
  );
}

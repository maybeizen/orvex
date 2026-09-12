import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { StatusDot } from "@/components/marketing/status-dot";
import { PROBE_SITES } from "@/lib/marketing/network";

export function LandingNetwork() {
  return (
    <MarketingSection id="network">
      <div className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Probe network"
          title="Checks from the edges"
          copy="The same request from six regions. You see which edge failed, not a blended average from one cloud AZ."
        />
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[32rem] text-left">
            <thead className="border-b border-border bg-muted">
              <tr className="font-mono text-[0.68rem] tracking-[0.12em] text-muted-foreground uppercase">
                <th className="px-4 py-3.5 font-medium sm:px-5">Site</th>
                <th className="px-4 py-3.5 font-medium sm:px-5">City</th>
                <th className="px-4 py-3.5 font-medium sm:px-5">Region</th>
                <th className="px-4 py-3.5 font-medium sm:px-5">RTT</th>
                <th className="px-4 py-3.5 font-medium sm:px-5">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PROBE_SITES.map((site) => (
                <tr key={site.code}>
                  <td className="px-4 py-3.5 font-mono text-sm sm:px-5">
                    {site.code}
                  </td>
                  <td className="px-4 py-3.5 text-sm sm:px-5">{site.city}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground sm:px-5">
                    {site.region}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-sm tabular-nums sm:px-5">
                    {site.latencyMs}ms
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase">
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

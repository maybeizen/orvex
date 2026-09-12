import { MarketingDocument } from "@/components/marketing/marketing-document";

const SECTIONS = [
  {
    title: "What this is",
    body: "Orvex Monitor is an uptime and incident product. You point checks at systems you operate. We probe them from the edges, keep a timeline, route the fail, and update a status page from the same events.",
  },
  {
    title: "What we check",
    body: "HTTP status and latency, response-body keywords, TLS expiry, heartbeats, and a typed Go agent for hosts the public internet cannot reach. Regions are IAD, SJC, LHR, FRA, SIN, and SYD.",
  },
  {
    title: "Who it is for",
    body: "A single operator on Probe, or a Team rotation on Sentinel and Command. Free exists so you can stand up five HTTP checks before you pay.",
  },
] as const;

export function AboutPage() {
  return (
    <MarketingDocument
      eyebrow="Company"
      title="A desk for when something fails"
      lede="Built around latency, uptime, incidents, and status pages — not a generic workspace."
    >
      <div className="flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-medium tracking-tight">
              {section.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </MarketingDocument>
  );
}

import { MarketingDocument } from "@/components/marketing/marketing-document";
import { PRIVACY_SECTIONS } from "@/lib/marketing/legal";

export function PrivacyPage() {
  return (
    <MarketingDocument
      eyebrow="Legal"
      title="Privacy"
      lede="Last updated 11 September 2026. What Orvex stores when you run a workspace."
    >
      <div className="flex flex-col gap-8">
        {PRIVACY_SECTIONS.map((section) => (
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

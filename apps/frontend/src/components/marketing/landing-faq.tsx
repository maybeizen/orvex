import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { FAQS } from "@/lib/marketing/faq";

export function LandingFaq() {
  return (
    <MarketingSection id="faq">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <SectionHeading
          eyebrow="Questions"
          title="Short answers before you stand up a workspace"
        />
        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-medium tracking-tight [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="font-mono text-muted-foreground transition-transform duration-150 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

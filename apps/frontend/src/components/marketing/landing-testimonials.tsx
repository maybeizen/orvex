import {
  MarketingSection,
  SectionHeading,
} from "@/components/marketing/marketing-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TESTIMONIALS } from "@/lib/marketing/testimonials";

export function LandingTestimonials() {
  return (
    <MarketingSection>
      <div className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="On-call"
          title="Built for the desk, not the demo"
        />
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure
              key={item.name}
              className="flex flex-col gap-8 bg-background p-8"
            >
              <blockquote className="text-sm text-pretty">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{item.initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.role}
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

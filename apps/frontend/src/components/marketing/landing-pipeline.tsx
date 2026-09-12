import { PIPELINE_STEPS } from "@/lib/marketing/pipeline";

export function LandingPipeline() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 md:py-24">
        <div className="flex max-w-xl flex-col gap-3">
          <p className="font-mono text-[0.68rem] tracking-[0.2em] text-primary uppercase">
            Incident path
          </p>
          <h2 className="font-display text-[2rem] leading-[1.15] md:text-[2.5rem]">
            From probe to page
          </h2>
          <p className="text-[0.95rem] leading-relaxed text-muted-foreground text-pretty">
            A failed check is a record, a route, and a page — not a screenshot
            in Slack an hour later.
          </p>
        </div>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {PIPELINE_STEPS.map((step, index) => (
            <li key={step.id} className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[0.7rem] text-primary">
                  {step.id}
                </span>
                {index < PIPELINE_STEPS.length - 1 ? (
                  <span className="hidden h-px flex-1 bg-border lg:block" />
                ) : null}
              </div>
              <h3 className="text-lg font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

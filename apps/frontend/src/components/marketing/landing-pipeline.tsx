import { PIPELINE_STEPS } from "@/lib/marketing/pipeline";

export function LandingPipeline() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-24 md:py-28">
        <div className="flex max-w-xl flex-col gap-4">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Incident path
          </p>
          <h2 className="font-heading text-3xl tracking-tight md:text-4xl">
            From probe to page
          </h2>
          <p className="text-muted-foreground text-pretty">
            A failed check is a record, a route, and a page — not a screenshot
            in Slack an hour later.
          </p>
        </div>
        <ol className="grid gap-10 md:grid-cols-4 md:gap-8">
          {PIPELINE_STEPS.map((step, index) => (
            <li key={step.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-primary">
                  {step.id}
                </span>
                {index < PIPELINE_STEPS.length - 1 ? (
                  <span className="hidden h-px flex-1 bg-border md:block" />
                ) : null}
              </div>
              <h3 className="font-heading text-lg tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground text-pretty">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

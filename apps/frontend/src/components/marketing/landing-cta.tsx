import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between md:py-20">
        <div className="flex max-w-xl flex-col gap-3">
          <p className="font-mono text-[0.68rem] tracking-[0.2em] text-primary uppercase">
            Next
          </p>
          <h2 className="font-display text-[2rem] leading-[1.15] text-balance md:text-[2.5rem]">
            Stand up the desk.
          </h2>
          <p className="text-[0.95rem] leading-relaxed text-muted-foreground text-pretty">
            Create a workspace, pick a plan, and point the first check at a URL
            you operate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" asChild>
            <Link to="/register">Get started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

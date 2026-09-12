import { Link } from "react-router";
import { HeroChecksPanel } from "@/components/marketing/hero-checks-panel";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="marketing-hero-wash pointer-events-none absolute inset-0" />
      <div className="marketing-grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-24">
        <div className="flex min-w-0 flex-col gap-6">
          <p className="marketing-enter font-mono text-[0.68rem] tracking-[0.22em] text-primary uppercase">
            Uptime monitoring
          </p>
          <h1 className="marketing-enter marketing-enter-1 font-display max-w-xl text-[2.35rem] leading-[1.08] text-balance sm:text-5xl lg:text-[3.35rem]">
            Every check. Every edge. One timeline.
          </h1>
          <p className="marketing-enter marketing-enter-2 max-w-lg text-[0.98rem] leading-relaxed text-muted-foreground text-pretty">
            HTTP, TLS, keyword, and heartbeat probes from six regions. A Go
            agent when the public internet cannot see in. Incidents and the
            status page share the same events.
          </p>
          <div className="marketing-enter marketing-enter-3 flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" asChild>
              <Link to="/register">Get started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#pricing">View pricing</a>
            </Button>
          </div>
        </div>
        <div className="marketing-enter marketing-enter-4 flex min-w-0 flex-col gap-3">
          <HeroChecksPanel />
          <p className="font-mono text-[0.62rem] tracking-[0.16em] text-muted-foreground uppercase">
            IAD · FRA · LHR · SIN · SJC · SYD
          </p>
        </div>
      </div>
    </section>
  );
}

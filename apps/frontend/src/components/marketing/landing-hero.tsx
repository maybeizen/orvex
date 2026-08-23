import { Link } from "react-router";
import { HeroChecksPanel } from "@/components/marketing/hero-checks-panel";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 marketing-hero-surface" />
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-16 px-6 py-24 md:py-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
        <div className="flex flex-col gap-8">
          <p className="font-mono text-xs tracking-[0.22em] text-primary uppercase">
            Uptime monitoring
          </p>
          <h1 className="font-heading max-w-xl text-4xl leading-[1.1] tracking-tight text-balance md:text-5xl lg:text-[3.25rem]">
            See every outage before your users do.
          </h1>
          <p className="max-w-lg text-base text-muted-foreground text-pretty">
            HTTP, TLS, keyword, and heartbeat checks from six regions. A Go
            agent for hosts the public internet cannot reach. One timeline when
            something fails.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" asChild>
              <Link to="/register">Get started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#pricing">View pricing</a>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <HeroChecksPanel />
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
            IAD · FRA · LHR · SIN · SJC · SYD
          </p>
        </div>
      </div>
    </section>
  );
}

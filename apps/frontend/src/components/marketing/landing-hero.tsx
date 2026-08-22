import { Activity } from "lucide-react";
import { Link } from "react-router";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <span className="font-heading text-sm font-medium">Orvex Monitor</span>
        </div>
        <ThemeToggle />
      </header>
      <section className="flex flex-1 flex-col justify-center gap-6 pb-24">
        <p className="text-sm font-medium text-primary">Uptime and infrastructure</p>
        <h1 className="font-heading text-4xl leading-tight tracking-tight text-balance">
          Watch every endpoint, heartbeat, and host from one shell.
        </h1>
        <p className="max-w-xl text-muted-foreground text-pretty">
          Orvex Monitor is a typed monitoring workspace. This scaffold ships the
          theme, auth, and API client — checks and collectors come next.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

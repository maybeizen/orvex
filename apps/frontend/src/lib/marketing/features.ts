import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Lock,
  Cpu,
  Bell,
  PanelTop,
  MapPinned,
} from "lucide-react";

export type FeatureCard = {
  title: string;
  body: string;
  icon: LucideIcon;
};

export const FEATURES: readonly FeatureCard[] = [
  {
    title: "HTTP and keyword checks",
    body: "Status codes, latency, and response-body keywords from every region you enable.",
    icon: Globe,
  },
  {
    title: "SSL expiry",
    body: "Certificate windows, chain health, and renewal lead time before browsers warn users.",
    icon: Lock,
  },
  {
    title: "Heartbeat agent",
    body: "A typed Go agent that reports host liveness when the public edge cannot see in.",
    icon: Cpu,
  },
  {
    title: "Incident routing",
    body: "Slack, Discord, PagerDuty, and webhooks from one routing table, not five integrations.",
    icon: Bell,
  },
  {
    title: "Status pages",
    body: "Public or private pages that stay in lockstep with the same probe data as on-call.",
    icon: PanelTop,
  },
  {
    title: "Regional probes",
    body: "Checks from IAD, FRA, LHR, SIN, SJC, and SYD — the edges, not one cloud AZ.",
    icon: MapPinned,
  },
];

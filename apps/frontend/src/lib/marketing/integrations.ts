import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Cloud,
  CloudFog,
  Container,
  Cpu,
  Code2,
  Globe,
  Hash,
  Lock,
  MessagesSquare,
  Radio,
  Send,
  Timer,
  Webhook,
} from "lucide-react";

export type IntegrationMark = {
  name: string;
  icon: LucideIcon;
};

export const INTEGRATIONS: readonly IntegrationMark[] = [
  { name: "HTTP", icon: Globe },
  { name: "ICMP", icon: Radio },
  { name: "SSL", icon: Lock },
  { name: "Cron", icon: Timer },
  { name: "Agent", icon: Cpu },
  { name: "Slack", icon: Hash },
  { name: "Discord", icon: MessagesSquare },
  { name: "PagerDuty", icon: Bell },
  { name: "Telegram", icon: Send },
  { name: "Webhooks", icon: Webhook },
  { name: "Grafana", icon: BarChart3 },
  { name: "Prometheus", icon: Activity },
  { name: "AWS", icon: Cloud },
  { name: "Cloudflare", icon: CloudFog },
  { name: "GitHub", icon: Code2 },
  { name: "Docker", icon: Container },
];

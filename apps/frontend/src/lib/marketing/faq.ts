export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQS: readonly FaqItem[] = [
  {
    question: "What can I monitor?",
    answer:
      "HTTP status and latency, response-body keywords, TLS expiry, heartbeats, and a Go agent for hosts the public internet cannot reach.",
  },
  {
    question: "Where do probes run?",
    answer:
      "IAD, SJC, LHR, FRA, SIN, and SYD. Free and Probe start at one region. Sentinel uses three. Command uses all six.",
  },
  {
    question: "How fast are the checks?",
    answer:
      "Free is every 5 minutes. Probe is 60s. Sentinel is 15s. Command is 5s.",
  },
  {
    question: "Do status pages share the same events?",
    answer:
      "Yes. Sentinel includes one status page. Command adds a custom domain. The page updates from the same records that page on-call.",
  },
  {
    question: "How do incidents route?",
    answer:
      "Email on Free and Probe. Slack and Discord on Sentinel. Command adds PagerDuty, webhooks, and the rest of the destinations.",
  },
  {
    question: "Is billing live?",
    answer:
      "Paid plans will bill through Stripe in a later release. You can create a paid workspace now; checkout may stay pending while you set up.",
  },
];

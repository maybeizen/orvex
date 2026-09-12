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
      "IAD, SJC, LHR, FRA, SIN, and SYD. Free starts at one region. Probe uses two. Sentinel uses four. Command uses all six.",
  },
  {
    question: "How fast are the checks?",
    answer: "Free is every 60s. Probe is 30s. Sentinel is 15s. Command is 5s.",
  },
  {
    question: "Do status pages share the same events?",
    answer:
      "Yes. Free and Probe include one status page. Sentinel includes three. Command adds a custom domain. The page updates from the same records that page on-call.",
  },
  {
    question: "How do incidents route?",
    answer:
      "Email on Free. Slack, Discord, and webhooks on Probe. SMS and chat on Sentinel. Command adds voice, PagerDuty, and the rest of the destinations.",
  },
  {
    question: "Is billing live?",
    answer:
      "Paid plans bill through Stripe Checkout. Free stays cardless. The customer portal handles plan changes and invoices.",
  },
];

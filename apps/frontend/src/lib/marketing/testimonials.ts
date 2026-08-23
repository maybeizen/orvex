export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "We used to learn about outages from Slack screenshots. Orvex pages us from the same probe that feeds the status page.",
    name: "Maya Chen",
    role: "SRE, Northwind Cloud",
    initials: "MC",
  },
  {
    quote:
      "The Go agent closed the blind spot behind NAT. Heartbeats fail closed, and the timeline is one place.",
    name: "Jordan Hale",
    role: "On-call lead, Atlas Freight",
    initials: "JH",
  },
  {
    quote:
      "Certificate windows sit next to latency. We stopped keeping expiry in a spreadsheet.",
    name: "Priya Nair",
    role: "Platform, Helios Labs",
    initials: "PN",
  },
];

import { MarketingDocument } from "@/components/marketing/marketing-document";
import { CHANGELOG_ENTRIES } from "@/lib/marketing/changelog";

export function ChangelogPage() {
  return (
    <MarketingDocument
      eyebrow="Product"
      title="Changelog"
      lede="What shipped. Monitor execution is still being wired; auth, workspaces, and the desk chrome are live."
    >
      <ol className="flex flex-col divide-y divide-border border-y border-border">
        {CHANGELOG_ENTRIES.map((entry) => (
          <li
            key={entry.title}
            className="grid gap-3 py-6 sm:grid-cols-[7rem_minmax(0,1fr)]"
          >
            <time className="font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase tabular-nums">
              {entry.date}
            </time>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium tracking-tight">
                {entry.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {entry.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </MarketingDocument>
  );
}

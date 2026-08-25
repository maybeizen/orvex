import type { OrganizationKind } from "@orvex/types";
import { UserRound, Users } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { OnboardingDraft } from "./draft";

const KINDS = [
  {
    id: "single" as const,
    title: "Single",
    description: "Just you. You cannot invite anyone.",
    icon: UserRound,
  },
  {
    id: "team" as const,
    title: "Team",
    description: "Share seats with the plan you pick next.",
    icon: Users,
  },
] as const;

export function TypeStep({
  draft,
  onChange,
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {KINDS.map((kind) => {
        const Icon = kind.icon;
        const selected = draft.kind === kind.id;
        return (
          <button
            key={kind.id}
            type="button"
            onClick={() => {
              onChange({ kind: kind.id satisfies OrganizationKind });
            }}
          >
            <Card
              className={cn(
                "h-full text-left transition-colors",
                selected
                  ? "bg-card ring-2 ring-primary"
                  : "bg-card/70 hover:bg-muted/40",
              )}
            >
              <CardHeader className="gap-3">
                <Icon className="size-5 text-primary" />
                <CardTitle>{kind.title}</CardTitle>
                <CardDescription>{kind.description}</CardDescription>
              </CardHeader>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

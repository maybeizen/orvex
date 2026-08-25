import { isPlanId, getPlan } from "@/lib/marketing/pricing";
import type { OrganizationKind } from "@orvex/types";
import { userInitials } from "@/lib/user-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const HUES = [210, 160, 28, 280, 340, 190] as const;

export function orgHue(seed: string): number {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 33 + character.charCodeAt(0)) >>> 0;
  }
  return HUES[hash % HUES.length] ?? 210;
}

export function OrgAvatar({
  name,
  iconUrl,
  className,
  size = "default",
}: {
  name: string;
  iconUrl: string | null;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const hue = orgHue(name.length === 0 ? "org" : name);

  return (
    <Avatar size={size} className={className}>
      {iconUrl === null ? null : <AvatarImage src={iconUrl} alt="" />}
      <AvatarFallback
        className="font-medium text-white"
        style={{ backgroundColor: `oklch(0.52 0.12 ${String(hue)})` }}
      >
        {userInitials(name.length === 0 ? "OR" : name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function orgPlanLabel(planId: string): string {
  if (isPlanId(planId)) {
    return getPlan(planId).name;
  }
  return planId;
}

export function orgKindLabel(kind: OrganizationKind): string {
  return kind === "team" ? "Team" : "Single";
}

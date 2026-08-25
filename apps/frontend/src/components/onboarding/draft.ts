import type { OrganizationKind, OrganizationPlanId } from "@orvex/types";
import type { BillingCycle } from "@orvex/types/plans";

export type OnboardingDraft = {
  name: string;
  slug: string;
  slugTouched: boolean;
  iconObjectUrl: string | null;
  iconBlob: Blob | null;
  kind: OrganizationKind;
  planId: OrganizationPlanId;
  billingCycle: BillingCycle;
  tosAccepted: boolean;
  marketingOptIn: boolean;
};

export const INITIAL_ONBOARDING_DRAFT: OnboardingDraft = {
  name: "",
  slug: "",
  slugTouched: false,
  iconObjectUrl: null,
  iconBlob: null,
  kind: "single",
  planId: "free",
  billingCycle: "monthly",
  tosAccepted: false,
  marketingOptIn: false,
};

export const ONBOARDING_STEPS = [
  {
    id: "identity",
    title: "Identity",
    description: "Name the workspace monitors and members will live in.",
  },
  {
    id: "type",
    title: "Type",
    description: "Single workspaces cannot invite anyone later.",
  },
  {
    id: "plan",
    title: "Plan",
    description: "Every limit is listed. Sentinel and Command need a team.",
  },
  {
    id: "legal",
    title: "Legal",
    description: "Accept the terms to create the organization.",
  },
] as const;

export type OnboardingStepIndex = 0 | 1 | 2 | 3;

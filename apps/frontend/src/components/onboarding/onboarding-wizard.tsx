import { isPaidPlan, planAllowsKind } from "@/lib/marketing/pricing";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Enter } from "@/components/motion/enter";
import {
  INITIAL_ONBOARDING_DRAFT,
  ONBOARDING_STEPS,
  type OnboardingDraft,
  type OnboardingStepIndex,
} from "@/components/onboarding/draft";
import { IdentityStep } from "@/components/onboarding/identity-step";
import { LegalStep } from "@/components/onboarding/legal-step";
import { PlanStep } from "@/components/onboarding/plan-step";
import { TypeStep } from "@/components/onboarding/type-step";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { uploadOrganizationIcon } from "@/lib/org-icon-api";
import { isValidOrgSlug, slugFromName } from "@/lib/organization-slug";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { useOrgStore } from "@/stores/org-store";

function applyDraftPatch(
  current: OnboardingDraft,
  patch: Partial<OnboardingDraft>,
): OnboardingDraft {
  const next = { ...current, ...patch };
  if (patch.name !== undefined && !next.slugTouched) {
    next.slug = slugFromName(patch.name);
  }
  if (patch.kind !== undefined && !planAllowsKind(next.planId, next.kind)) {
    next.planId = "free";
  }
  return next;
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<OnboardingStepIndex>(0);
  const [draft, setDraft] = useState<OnboardingDraft>(INITIAL_ONBOARDING_DRAFT);
  const [pending, setPending] = useState(false);
  const meta = ONBOARDING_STEPS[step];
  const paid = isPaidPlan(draft.planId);

  function patchDraft(patch: Partial<OnboardingDraft>) {
    setDraft((current) => applyDraftPatch(current, patch));
  }

  function canContinue(): boolean {
    if (step === 0) {
      return draft.name.trim().length > 0 && isValidOrgSlug(draft.slug);
    }
    if (step === 3) {
      return draft.tosAccepted;
    }
    return true;
  }

  async function submit() {
    if (!draft.tosAccepted) {
      toast.error("Accept the terms to continue");
      return;
    }
    if (!isValidOrgSlug(draft.slug) || draft.name.trim().length === 0) {
      toast.error("Fix the organization name and slug");
      setStep(0);
      return;
    }

    setPending(true);
    try {
      const organization =
        await createVanillaTrpcClient().organization.create.mutate({
          name: draft.name.trim(),
          slug: draft.slug,
          kind: draft.kind,
          planId: draft.planId,
          billingCycle: draft.billingCycle,
          tosAccepted: true,
          marketingOptIn: draft.marketingOptIn,
        });
      let next = organization;
      if (draft.iconBlob !== null) {
        try {
          next = await uploadOrganizationIcon(organization.id, draft.iconBlob);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to upload icon";
          toast.error(message);
        }
      }
      useOrgStore.getState().upsert(next);
      if (draft.iconObjectUrl !== null) {
        URL.revokeObjectURL(draft.iconObjectUrl);
      }
      if (paid) {
        toast.success("Organization created");
        void navigate("/onboarding/checkout");
        return;
      }
      toast.success("Organization ready");
      void navigate("/organizations");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create organization";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function goNext() {
    if (!canContinue()) {
      if (step === 0) {
        toast.error("Choose a name and a valid slug");
      }
      return;
    }
    if (step === 3) {
      void submit();
      return;
    }
    setStep((current) => (current + 1) as OnboardingStepIndex);
  }

  const submitLabel = paid ? "Continue to checkout" : "Create organization";

  return (
    <Card className="w-full max-w-3xl gap-0 py-0">
      <CardHeader className="gap-4 border-b border-border py-6">
        <Enter>
          <ol className="flex flex-wrap items-center gap-2">
            {ONBOARDING_STEPS.map((item, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <li key={item.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full font-mono text-xs",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-primary/20 text-primary",
                      !active && !done && "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm sm:inline",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </Enter>
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading text-xl tracking-tight">
            {meta.title}
          </CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={meta.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {step === 0 ? (
              <IdentityStep draft={draft} onChange={patchDraft} />
            ) : null}
            {step === 1 ? (
              <TypeStep draft={draft} onChange={patchDraft} />
            ) : null}
            {step === 2 ? (
              <PlanStep draft={draft} onChange={patchDraft} />
            ) : null}
            {step === 3 ? (
              <LegalStep draft={draft} onChange={patchDraft} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending || step === 0}
          onClick={() => {
            setStep((current) => (current - 1) as OnboardingStepIndex);
          }}
        >
          Back
        </Button>
        <Button
          type="button"
          disabled={pending || !canContinue()}
          onClick={goNext}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {step === 3 ? submitLabel : "Next"}
        </Button>
      </CardFooter>
    </Card>
  );
}

import { Link } from "react-router";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import type { OnboardingDraft } from "./draft";

export function LegalStep({
  draft,
  onChange,
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <FieldGroup>
      <Field orientation="horizontal" data-invalid={!draft.tosAccepted}>
        <Checkbox
          id="tos"
          checked={draft.tosAccepted}
          aria-invalid={!draft.tosAccepted}
          onCheckedChange={(value) => {
            onChange({ tosAccepted: value === true });
          }}
        />
        <FieldContent>
          <FieldLabel htmlFor="tos">I agree to the Terms of Service</FieldLabel>
          <FieldDescription>
            Required. Read the{" "}
            <Link to="/terms" target="_blank" rel="noreferrer">
              Orvex terms
            </Link>{" "}
            before creating a workspace.
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <Checkbox
          id="marketing"
          checked={draft.marketingOptIn}
          onCheckedChange={(value) => {
            onChange({ marketingOptIn: value === true });
          }}
        />
        <FieldContent>
          <FieldLabel htmlFor="marketing">Email me product updates</FieldLabel>
          <FieldDescription>
            Optional. Incident alerts are always on for monitors you own.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}

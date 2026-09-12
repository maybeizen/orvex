import {
  BILLING_CYCLES,
  cycleDiscountLabel,
  cycleHeading,
  type BillingCycle,
} from "@/lib/marketing/pricing";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function CycleToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === "monthly" || next === "quarterly" || next === "yearly") {
          onChange(next);
        }
      }}
      variant="outline"
      spacing={0}
      className="border border-border bg-card font-mono"
    >
      {BILLING_CYCLES.map((item) => {
        const discount = cycleDiscountLabel(item);
        return (
          <ToggleGroupItem
            key={item}
            value={item}
            className="gap-2 px-3.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {cycleHeading(item)}
            {discount === null ? null : (
              <span className="text-[0.65rem] tracking-wide opacity-80">
                {discount}
              </span>
            )}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

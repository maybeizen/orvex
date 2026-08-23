import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useThemeStore, type ThemePreference } from "@/stores/theme-store";

const OPTIONS = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeSwitcher({ className }: { className?: string }) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <TooltipProvider delayDuration={0}>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) => {
          if (value === "dark" || value === "light" || value === "system") {
            setTheme(value);
          }
        }}
        variant="outline"
        size="sm"
        spacing={0}
        className={cn("w-full", className)}
      >
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={option.value}
                  aria-label={option.label}
                  className="flex-1 px-0"
                >
                  <Icon aria-hidden />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent side="top">{option.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </ToggleGroup>
    </TooltipProvider>
  );
}

export function ThemeMenuItems() {
  return (
    <div className="px-1 py-1">
      <ThemeSwitcher />
    </div>
  );
}

export const THEME_OPTIONS: readonly {
  value: ThemePreference;
  label: string;
  icon: typeof Moon;
}[] = OPTIONS;

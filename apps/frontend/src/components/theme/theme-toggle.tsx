import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle color theme"
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full bg-muted p-1"
    >
      <motion.span
        className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        {isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </motion.span>
    </button>
  );
}

import { useLayoutEffect, type ReactNode } from "react";
import { resolveTheme, useThemeStore } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemeStore((state) => state.theme);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(): void {
      const resolved = resolveTheme(
        useThemeStore.getState().theme,
        media.matches,
      );
      document.documentElement.classList.toggle("dark", resolved === "dark");
    }

    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
    };
  }, [preference]);

  return children;
}

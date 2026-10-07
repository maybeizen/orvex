import type { MouseEvent } from "react";

export function SkipLink() {
  function onActivate(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById("main-content");
    if (target === null) {
      return;
    }
    event.preventDefault();
    target.focus();
  }

  return (
    <a
      href="#main-content"
      onClick={onActivate}
      className="fixed top-3 left-3 z-50 -translate-y-24 rounded-md bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:translate-y-0 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      Skip to content
    </a>
  );
}

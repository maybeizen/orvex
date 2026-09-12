import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { ORGANIZATIONS_PATH } from "@/lib/org-paths";
import { useSessionStore } from "@/stores/session-store";

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === "loading") {
    return null;
  }

  if (user !== null) {
    return <Navigate to={ORGANIZATIONS_PATH} replace />;
  }

  return children;
}

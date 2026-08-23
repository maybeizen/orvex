import type { AuthUser } from "@orvex/types";
import { useEffect } from "react";
import { hydrateOrganizations } from "@/lib/post-auth";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

async function hydrateUser(user: AuthUser): Promise<AuthUser> {
  useOrgStore.getState().markLoading();
  try {
    await hydrateOrganizations();
  } catch {
    useOrgStore.getState().hydrate([], null);
  }
  return user;
}

export function SessionHydrator() {
  const setSession = useSessionStore((state) => state.setSession);
  const resetSession = useSessionStore((state) => state.resetSession);

  useEffect(() => {
    if (!isAuthConfigured()) {
      useOrgStore.getState().reset();
      resetSession();
      return;
    }

    useSessionStore.setState({ status: "loading" });
    const auth = getBrowserAuth();
    const alive = { current: true };

    async function applyUser(user: AuthUser | null): Promise<void> {
      if (user === null) {
        useOrgStore.getState().reset();
        if (alive.current) {
          setSession(null);
        }
        return;
      }
      const next = await hydrateUser(user);
      if (alive.current) {
        setSession(next);
      }
    }

    void auth
      .getBrowserSession()
      .then((session) => applyUser(session?.user ?? null))
      .catch(() => {
        if (alive.current) {
          useOrgStore.getState().reset();
          resetSession();
        }
      });

    const unsubscribe = auth.onAuthStateChange((session) => {
      void applyUser(session?.user ?? null);
    });

    return () => {
      alive.current = false;
      unsubscribe();
    };
  }, [resetSession, setSession]);

  return null;
}

import type { AuthUser } from "@orvex/types";
import { create } from "zustand";

export type SessionStatus = "loading" | "ready";

type SessionState = {
  status: SessionStatus;
  user: AuthUser | null;
  setSession: (user: AuthUser | null) => void;
  resetSession: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
  status: "ready",
  user: null,
  setSession: (user) => {
    set({ status: "ready", user });
  },
  resetSession: () => {
    set({ status: "ready", user: null });
  },
}));

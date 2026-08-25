import { AnimatePresence, motion } from "motion/react";
import { LogIn } from "lucide-react";
import { Link } from "react-router";
import { AccountMenu } from "@/components/auth/account-menu";
import { SidebarTooltip } from "@/components/layout/sidebar-tooltip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { useSessionStore } from "@/stores/session-store";
import { useSidebarStore } from "@/stores/sidebar-store";

const swap = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
};

export function AuthNavCluster({
  guest = "buttons",
  layout = "nav",
}: {
  guest?: "buttons" | "signin";
  layout?: "nav" | "sidebar";
}) {
  const user = useSessionStore((state) => state.user);
  const status = useSessionStore((state) => state.status);
  const collapsed = useSidebarStore((state) => state.collapsed);
  const sidebar = layout === "sidebar";
  const rail = sidebar && collapsed;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "loading" ? (
        <motion.div
          key="boot"
          className={cn(sidebar && "w-full", rail && "flex justify-center")}
          {...swap}
        >
          <Skeleton
            className={cn(
              "rounded-full",
              rail ? "size-8" : sidebar ? "h-10 w-full" : "size-8",
            )}
          />
        </motion.div>
      ) : user !== null ? (
        <motion.div
          key="account"
          className={cn(sidebar && "w-full", rail && "flex justify-center")}
          {...swap}
        >
          <AccountMenu user={user} layout={layout} />
        </motion.div>
      ) : guest === "signin" ? (
        <motion.div
          key="signin"
          className={cn(sidebar && "w-full", rail && "flex justify-center")}
          {...swap}
        >
          <SidebarTooltip label="Sign in" enabled={rail}>
            <Button
              variant="ghost"
              size={rail ? "icon" : "default"}
              className={cn(sidebar && !collapsed && "w-full justify-start")}
              asChild
            >
              <Link to="/login" aria-label={rail ? "Sign in" : undefined}>
                {rail ? <LogIn /> : "Sign in"}
              </Link>
            </Button>
          </SidebarTooltip>
        </motion.div>
      ) : (
        <motion.div
          key="guest"
          className={cn(
            "flex items-center gap-3",
            sidebar && "w-full flex-col",
          )}
          {...swap}
        >
          <Button variant="ghost" className={cn(sidebar && "w-full")} asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button className={cn(sidebar && "w-full")} asChild>
            <Link to="/register">Get started</Link>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

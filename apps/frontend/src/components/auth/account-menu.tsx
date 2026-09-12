import type { AuthUser } from "@orvex/types";
import { ChevronDown, LogOut, Settings, Shield, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeMenuItems } from "@/components/theme/theme-menu-items";
import { SidebarTooltip } from "@/components/layout/sidebar-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountOrgSwitcher } from "@/components/organization/org-switcher";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { accountHandle, userInitials } from "@/lib/user-display";
import {
  ADMIN_PATH,
  USER_PROFILE_PATH,
  USER_SETTINGS_PATH,
} from "@/lib/org-paths";
import { cn } from "@/lib/cn";
import { getBrowserAuth } from "@/lib/supabase";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AccountMenuItems({
  user,
  pending = false,
  onLogout,
}: {
  user: AuthUser;
  pending?: boolean;
  onLogout?: () => void;
}) {
  const handle = accountHandle(user);
  const staff = isPlatformAdmin(user);

  return (
    <>
      <DropdownMenuLabel className="flex flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">
          {handle}
        </span>
        <span className="truncate font-normal">{user.email}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <ThemeMenuItems />
      <DropdownMenuSeparator />
      <AccountOrgSwitcher />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link to={USER_PROFILE_PATH}>
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={USER_SETTINGS_PATH}>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        disabled={pending}
        onSelect={() => {
          onLogout?.();
        }}
      >
        <LogOut />
        Log Out
      </DropdownMenuItem>
      {staff ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Admin</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={ADMIN_PATH}>
                <Shield />
                Staff console
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      ) : null}
    </>
  );
}

export function AccountMenu({
  user,
  layout = "nav",
}: {
  user: AuthUser;
  layout?: "nav" | "sidebar";
}) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const handle = accountHandle(user);
  const initials = userInitials(
    user.username === null || user.username.length === 0
      ? user.displayName
      : user.username,
  );
  const sidebar = layout === "sidebar";
  const collapsed = useSidebarStore((state) => state.collapsed);
  const rail = sidebar && collapsed;

  async function logout() {
    setPending(true);
    try {
      await getBrowserAuth().signOut();
      toast.success("Signed out");
      void navigate("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign out";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <SidebarTooltip label={handle} enabled={rail}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "gap-2",
              rail && "size-9 p-0",
              sidebar && !collapsed && "h-auto w-full justify-start px-2 py-2",
              !sidebar && "h-9 pr-2 pl-1",
            )}
            aria-label={`Account menu for ${handle}`}
            disabled={pending}
          >
            <Avatar size="sm">
              {user.avatarUrl === null ? null : (
                <AvatarImage src={user.avatarUrl} alt="" />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "truncate",
                rail && "sr-only",
                sidebar && !collapsed && "min-w-0 flex-1 text-left",
                !sidebar && "hidden max-w-36 md:inline",
              )}
            >
              {handle}
            </span>
            {rail ? null : (
              <ChevronDown
                data-icon="inline-end"
                className="transition-transform duration-200 group-data-[state=open]/button:rotate-180"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
      </SidebarTooltip>
      <DropdownMenuContent
        align={sidebar ? "start" : "end"}
        side={rail ? "right" : sidebar ? "top" : "bottom"}
        className="min-w-56 duration-200"
      >
        <AccountMenuItems
          user={user}
          pending={pending}
          onLogout={() => {
            void logout();
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import type { Organization } from "@orvex/types";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, LayoutGrid, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { OrgAvatar, orgPlanLabel } from "@/components/organization/org-avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { activateOrganization } from "@/lib/activate-organization";
import { cn } from "@/lib/cn";
import { ORGANIZATIONS_HOME, switchOrgPath } from "@/lib/org-paths";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

function handleSwitch(organization: Organization): void {
  void activateOrganization(organization)
    .then(() => {
      toast.success(`Switched to ${organization.name}`);
    })
    .catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to switch organization";
      toast.error(message);
    });
}

function OrgRow({
  organization,
  current = false,
  chevron = false,
  expanded = false,
}: {
  organization: Organization;
  current?: boolean;
  chevron?: boolean;
  expanded?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <OrgAvatar
        name={organization.name}
        iconUrl={organization.iconUrl}
        size="sm"
      />
      <span className="min-w-0 flex-1 truncate">{organization.name}</span>
      <Badge variant="outline" className="font-mono uppercase">
        {orgPlanLabel(organization.planId)}
      </Badge>
      {current && !chevron ? <Check className="text-primary" /> : null}
      {chevron ? (
        <ChevronDown
          className={cn(
            "shrink-0 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      ) : null}
    </span>
  );
}

export function AccountOrgSwitcher() {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const items = useOrgStore((state) => state.items);
  const active = useOrgStore(selectActiveOrganization);

  if (active === null || items.length === 0) {
    return null;
  }

  const others = items.filter((item) => item.id !== active.id);

  return (
    <>
      <DropdownMenuGroup>
        <div className="flex flex-col">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
            aria-expanded={expanded}
            aria-label={`Organization ${active.name}`}
            onClick={() => {
              setExpanded((value) => !value);
            }}
          >
            <OrgRow organization={active} current chevron expanded={expanded} />
          </button>
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                key="org-list"
                className="grid"
                initial={
                  reduceMotion ? false : { gridTemplateRows: "0fr", opacity: 0 }
                }
                animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                exit={
                  reduceMotion
                    ? { gridTemplateRows: "1fr", opacity: 1 }
                    : { gridTemplateRows: "0fr", opacity: 0 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="flex flex-col gap-0.5 pt-1">
                    {others.map((organization) => (
                      <DropdownMenuItem
                        key={organization.id}
                        onSelect={() => {
                          handleSwitch(organization);
                        }}
                      >
                        <OrgRow organization={organization} />
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem asChild>
                      <Link to="/onboarding">
                        <Plus />
                        New organization
                      </Link>
                    </DropdownMenuItem>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
    </>
  );
}

export function HeaderOrgControl({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
} = {}) {
  const items = useOrgStore((state) => state.items);
  const active = useOrgStore(selectActiveOrganization);
  const pathname = useLocation().pathname;
  const navigate = useNavigate();

  if (active === null) {
    return null;
  }

  function switchTo(organization: Organization): void {
    void activateOrganization(organization)
      .then(() => {
        toast.success(`Switched to ${organization.name}`);
        void navigate(switchOrgPath(pathname, organization.slug));
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to switch organization";
        toast.error(message);
      });
  }

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Organization ${active.name}`}
      >
        <OrgAvatar name={active.name} iconUrl={active.iconUrl} size="sm" />
        <span className="max-w-40 truncate text-foreground">{active.name}</span>
        <ChevronDown className="shrink-0 transition-transform duration-200 group-data-[state=open]/button:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuGroup>
          {items.map((organization) => (
            <DropdownMenuItem
              key={organization.id}
              disabled={organization.id === active.id}
              onSelect={() => {
                if (organization.id !== active.id) {
                  switchTo(organization);
                }
              }}
            >
              <OrgRow
                organization={organization}
                current={organization.id === active.id}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={ORGANIZATIONS_HOME}>
              <LayoutGrid />
              All organizations
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/onboarding">
              <Plus />
              New organization
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

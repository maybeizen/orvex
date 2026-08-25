import { useLocation } from "react-router";
import { HeaderOrgControl } from "@/components/organization/org-switcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { appPageTitle } from "@/lib/app-pages";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function AppBreadcrumb() {
  const pathname = useLocation().pathname;
  const title = appPageTitle(pathname);
  const organization = useOrgStore(selectActiveOrganization);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {organization === null ? null : (
          <>
            <BreadcrumbItem>
              <HeaderOrgControl />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

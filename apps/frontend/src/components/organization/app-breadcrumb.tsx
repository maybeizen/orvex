import { Link, useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { appPageTitle } from "@/lib/app-pages";
import {
  isUserScopedPath,
  organizationHomePath,
  parseOrganizationSlug,
} from "@/lib/org-paths";
import { selectOrganizationBySlug, useOrgStore } from "@/stores/org-store";

export function AppBreadcrumb() {
  const pathname = useLocation().pathname;
  const title = appPageTitle(pathname);
  const slug = parseOrganizationSlug(pathname);
  const routeOrganization = useOrgStore((state) =>
    slug === null ? null : selectOrganizationBySlug(state, slug),
  );
  const userScoped = isUserScopedPath(pathname);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {userScoped || routeOrganization === null ? null : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={organizationHomePath(routeOrganization.slug)}>
                  {routeOrganization.name}
                </Link>
              </BreadcrumbLink>
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

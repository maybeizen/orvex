export const ORGANIZATIONS_HOME = "/organizations";

export function orgWorkspacePath(slug: string, page = "dashboard"): string {
  return `${ORGANIZATIONS_HOME}/${slug}/${page}`;
}

export function switchOrgPath(pathname: string, nextSlug: string): string {
  const prefix = `${ORGANIZATIONS_HOME}/`;
  if (!pathname.startsWith(prefix)) {
    return orgWorkspacePath(nextSlug);
  }
  const afterHome = pathname.slice(prefix.length);
  const slash = afterHome.indexOf("/");
  if (slash === -1) {
    return orgWorkspacePath(nextSlug);
  }
  const rest = afterHome.slice(slash + 1);
  if (rest.length === 0) {
    return orgWorkspacePath(nextSlug);
  }
  return `${ORGANIZATIONS_HOME}/${nextSlug}/${rest}`;
}

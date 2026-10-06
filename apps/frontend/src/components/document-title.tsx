import { useEffect } from "react";
import { useLocation } from "react-router";
import { titleForPath } from "@/lib/document-title";

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return null;
}

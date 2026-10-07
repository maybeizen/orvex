import { lazy, Suspense, type ComponentType } from "react";
import { LoadingPanel } from "@/components/console/console-panel";

export function lazyRoute(
  load: () => Promise<Record<string, ComponentType>>,
  name: string,
): ComponentType {
  const Page = lazy(async () => {
    const module = await load();
    const component = module[name];
    if (component === undefined) {
      throw new Error(`route export missing: ${name}`);
    }
    return { default: component };
  });

  function LazyRoute() {
    return (
      <Suspense fallback={<LoadingPanel className="min-h-40" />}>
        <Page />
      </Suspense>
    );
  }

  LazyRoute.displayName = `Lazy(${name})`;
  return LazyRoute;
}

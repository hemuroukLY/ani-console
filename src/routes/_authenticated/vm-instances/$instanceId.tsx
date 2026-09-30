import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { VmInstanceDetailPage } from "@/components/instances/VmInstanceDetailPage";

export const Route = createFileRoute("/_authenticated/vm-instances/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function VmInstanceDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const pathname = useRouterState({
      select: (state) => state.location.pathname,
    });
    if (pathname !== `/vm-instances/${instanceId}`) return <Outlet />;
    return (
      <VmInstanceDetailPage
        instanceId={instanceId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({ search: (current) => ({ ...current, tab: nextTab }), replace: true })
        }
      />
    );
  },
});

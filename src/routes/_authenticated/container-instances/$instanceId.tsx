import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { ContainerInstanceDetailPage } from "@/components/instances/ContainerInstanceDetailPage";

export const Route = createFileRoute("/_authenticated/container-instances/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function ContainerInstanceDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    if (pathname !== `/container-instances/${instanceId}`) return null;
    return (
      <ContainerInstanceDetailPage
        instanceId={instanceId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({
            search: (current) => ({ ...current, tab: nextTab }),
            replace: true,
          })
        }
      />
    );
  },
});

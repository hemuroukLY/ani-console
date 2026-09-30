import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GpuInstanceDetailPage } from "@/components/instances/GpuInstanceDetailPage";

export const Route = createFileRoute("/_authenticated/gpu-instances/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function GpuInstanceDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });

    return (
      <GpuInstanceDetailPage
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

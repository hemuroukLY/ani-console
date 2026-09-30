import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SandboxInstanceDetailPage } from "@/components/instances/SandboxInstanceDetailPage";

export const Route = createFileRoute("/_authenticated/sandbox-instances/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function SandboxInstanceDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    return (
      <SandboxInstanceDetailPage
        instanceId={instanceId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({ search: (current) => ({ ...current, tab: nextTab }), replace: true })
        }
      />
    );
  },
});

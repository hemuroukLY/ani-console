import { VectorStoreDetailPage } from "@/components/storage/VectorStoreDetailPage";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/vector-stores/$vectorStoreId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function VectorStoreDetailRoute() {
    const { vectorStoreId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    return (
      <VectorStoreDetailPage
        vectorStoreId={vectorStoreId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({ search: (current) => ({ ...current, tab: nextTab }), replace: true })
        }
      />
    );
  },
});

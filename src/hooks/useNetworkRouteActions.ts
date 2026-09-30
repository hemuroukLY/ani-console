import { useResourceDelete } from "@/hooks/useResourceDelete";
import { type NetworkRoute } from "@/api/network";
import type { RowAction } from "@/components/common";

export function useNetworkRouteActions(onDeleted: (item: NetworkRoute) => void) {
  const deleteRoute = useResourceDelete<NetworkRoute>("network-route", onDeleted);

  const actions: RowAction<NetworkRoute>[] = [
    {
      key: "delete",
      label: "删除",
      disabled: deleteRoute.isDisabled,
      intent: "danger",
      loading: (item) => deleteRoute.isPending && deleteRoute.variables?.id === item.id,
      onClick: (item) => void deleteRoute.confirm(item),
    },
  ];
  return { actions };
}

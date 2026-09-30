import { useResourceDelete } from "@/hooks/useResourceDelete";
import { type NetworkSubnet } from "@/api/network";
import type { RowAction } from "@/components/common";
type Subnet = NetworkSubnet;
export function useSubnetActions(onDeleted: (item: Subnet) => void) {
  const deleteSubnet = useResourceDelete<Subnet>("subnet", onDeleted);

  const actions: RowAction<Subnet>[] = [
    {
      key: "delete",
      label: "删除",
      disabled: deleteSubnet.isDisabled,
      loading: (item) => deleteSubnet.isPending && deleteSubnet.variables?.id === item.id,
      intent: "danger",
      onClick: (subnet) => void deleteSubnet.confirm(subnet),
    },
  ];
  return { actions };
}

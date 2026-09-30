import { useQueryClient } from "@tanstack/react-query";
import { useKubeconfigDownload } from "@/hooks/useKubeconfigDownload";
import { useResourceDelete } from "@/hooks/useResourceDelete";
import { type K8sCluster } from "@/api/k8s-clusters";
import type { RowAction } from "@/components/common";
type Cluster = K8sCluster;
export function useK8sClusterActions(onDeleted?: (item: Cluster) => void) {
  const qc = useQueryClient();
  const deleteCluster = useResourceDelete<Cluster>("k8s-cluster", (item) => {
    if (onDeleted) onDeleted(item);
    else void qc.invalidateQueries({ queryKey: ["k8s-clusters"] });
  });
  const downloadKubeconfig = useKubeconfigDownload();
  const actions: RowAction<Cluster>[] = [
    {
      key: "kubeconfig",
      label: "kubeconfig",
      loading: () => downloadKubeconfig.isPending,
      onClick: (cluster) => downloadKubeconfig.mutate(cluster.id),
    },
    {
      key: "delete",
      label: "删除",
      disabled: deleteCluster.isDisabled,
      loading: (item) => deleteCluster.isPending && deleteCluster.variables?.id === item.id,
      intent: "danger",
      onClick: (cluster) => void deleteCluster.confirm(cluster),
    },
  ];
  return { actions };
}

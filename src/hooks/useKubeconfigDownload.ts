import { getK8sClusterKubeconfig } from "@/api/k8s-clusters";
import { downloadBlob } from "@/lib/browser";
import { useMutation } from "@tanstack/react-query";
export function useKubeconfigDownload() {
  return useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "kubeconfig-download",
        action: "下载 Kubeconfig",
        errorFallback: "下载失败",
      },
    },
    mutationFn: async (clusterId: string | undefined) => {
      if (!clusterId) throw new Error("缺少集群 ID");
      const data = await getK8sClusterKubeconfig(clusterId);
      if (!data.kubeconfig?.trim()) throw new Error("未返回有效的 Kubeconfig");
      downloadBlob(
        new Blob([data.kubeconfig], { type: "text/yaml" }),
        `kubeconfig-${clusterId}.yaml`,
      );
    },
  });
}

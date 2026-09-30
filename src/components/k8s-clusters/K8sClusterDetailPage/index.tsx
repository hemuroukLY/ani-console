import { useK8sClusterActions } from "@/hooks/useK8sClusterActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";

import { getK8sCluster } from "@/api/k8s-clusters";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

import { useQuery } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useCallback, useState } from "react";

import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { K8sEvents } from "./K8sEvents";
import { K8sKubeconfig } from "./K8sKubeconfig";
import { K8sNodePools } from "./K8sNodePools";
import { K8sWorkloads } from "./K8sWorkloads";

export function K8sClusterDetailPage({ clusterId }: { clusterId: string }) {
  const goBack = useBackOrFallback("k8s-cluster");
  const [nodeCount, setNodeCount] = useState(0);
  const handleNodeCountChange = useCallback((count: number) => setNodeCount(count), []);
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("k8s-cluster", clusterId),
        action: "K8s 集群加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["k8s-cluster", clusterId],
    queryFn: () => getK8sCluster(clusterId),
  });
  const { actions } = useK8sClusterActions(goBack);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const cluster = detail.data;

  return (
    <DetailPageFrame
      breadcrumbs={[
        ...navigationBreadcrumbsForPath("/k8s-clusters"),
        { label: cluster.name ?? clusterId },
      ]}
      icon={<AliIcon name="jiqun" size={28} />}
      title={cluster.name ?? clusterId}
      status={<StatusBadge status={cluster.state} />}
      headerItems={[
        { label: "区域", value: "-" },
        { label: "K8s 版本", value: cluster.version ?? "-" },
        { label: "节点数", value: String(nodeCount) },
      ]}
      actions={<ResourceActionMenu record={cluster} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={cluster.id ?? clusterId} /> },
            { label: "区域", value: "-" },
            { label: "K8s 版本", value: cluster.version ?? "-" },
            { label: "节点数", value: nodeCount },
            { label: "创建时间", value: formatDateTime(cluster.created_at) },
            { label: "关联对象", value: "1 个" },
          ],
        },
        {
          key: "related",
          title: "关联摘要",
          fields: [{ label: "关联对象", value: "1 个" }],
          defaultCollapsed: true,
        },
      ]}
      tabs={[
        {
          key: "nodes",
          label: "节点",
          content: <K8sNodePools clusterId={clusterId} onNodeCountChange={handleNodeCountChange} />,
        },
        {
          key: "workloads",
          label: "工作负载",
          content: <K8sWorkloads clusterId={clusterId} />,
        },
        {
          key: "kubeconfig",
          label: "kubeconfig",
          content: <K8sKubeconfig clusterId={clusterId} />,
        },
        { key: "events", label: "事件", content: <K8sEvents /> },
      ]}
      onBack={goBack}
    />
  );
}

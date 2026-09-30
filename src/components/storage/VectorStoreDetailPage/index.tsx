import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { useVectorStoreActions } from "@/hooks/useVectorStoreActions";

import { getVectorStore, type VectorStore } from "@/api/storage/vector-stores";
import { withId } from "@/lib/id";

import { useQuery } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";

import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { VectorStoreWorkbench } from "@/components/storage/VectorStoreWorkbench";
import { formatDateTime } from "@/lib/format";
import { VectorStoreRelatedResources } from "./VectorStoreRelatedResources";

export type VectorStoreDetailTabKey = "search" | "related";

export function VectorStoreDetailPage({
  vectorStoreId,
  tab,
}: {
  vectorStoreId: string;
  tab?: VectorStoreDetailTabKey;
}) {
  const goBack = useBackOrFallback("vector-store");
  const { actions } = useVectorStoreActions(goBack);
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("vector-store", vectorStoreId),
        action: "向量存储加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["vector-store", vectorStoreId],
    queryFn: () => getVectorStore(vectorStoreId),
  });

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const store = detail.data as VectorStore;
  const storeStatus = <StatusBadge status={store.state} reason={store.reason} />;
  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/vector-stores"), { label: store.name }]}
      title={store.name}
      status={storeStatus}
      icon={<AliIcon name="xiangliangcunchu" size={28} />}
      headerItems={[{ label: "维度", value: String(store.dimension) }]}
      actions={<ResourceActionMenu record={store} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={store.id} /> },
            { label: "向量维度", value: store.dimension },
            { label: "距离度量", value: store.metric.toUpperCase() },
            { label: "向量化模型", value: store.embedding_model || "-" },
            { label: "向量数", value: store.vector_count ?? 0 },
            {
              label: "最近索引",
              value: store.last_indexed_at ? formatDateTime(store.last_indexed_at) : "-",
            },
            { label: "创建时间", value: formatDateTime(store.created_at) },
            { label: "更新时间", value: formatDateTime(store.updated_at) },
          ],
        },
        {
          key: "related-summary",
          title: "关联摘要",
          fields: store.knowledge_base_ref
            ? [
                {
                  label: "知识库",
                  value: store.knowledge_base_ref.name,
                },
              ]
            : [{ label: "暂无关联对象", value: "-" }],
        },
      ]}
      tabs={[
        {
          key: "related",
          label: "关联资源",
          content: <VectorStoreRelatedResources store={store} />,
        },
        {
          key: "search",
          label: "检索",
          content: <VectorStoreWorkbench store={store} />,
        },
        /* 当前 Core API 未提供向量存储事件列表接口，保留代码待接口开放后恢复。
        {
          key: "events",
          label: "事件",
          content: (
            <Space direction="vertical" size={12} className="w-full">
              <Empty description="当前 Core API 暂未提供向量存储事件列表" />
            </Space>
          ),
        },
        */
      ]}
      defaultTabKey={tab}
      onBack={goBack}
    />
  );
}

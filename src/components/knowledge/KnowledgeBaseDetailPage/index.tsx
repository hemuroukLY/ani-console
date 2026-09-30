import { useKnowledgeBaseActions } from "@/hooks/useKnowledgeBaseActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";

import { getKnowledgeBase } from "@/api/knowledge";
import { listVectorStores, type VectorStore } from "@/api/storage/vector-stores";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { KnowledgeChat } from "@/components/knowledge/KnowledgeChat";
import { KnowledgeDocuments } from "@/components/knowledge/KnowledgeDocuments";
import { KnowledgeDocumentUploadButton } from "@/components/knowledge/KnowledgeDocumentUploadButton";
import { KnowledgePermissions } from "@/components/knowledge/KnowledgePermissions";
import { KnowledgeBaseAuditLogs } from "@/components/knowledge/KnowledgeBaseAuditLogs";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";

export type KnowledgeBaseDetailTabKey =
  | "overview"
  | "documents"
  | "chat"
  | "permissions"
  | "history";

export function KnowledgeBaseDetailPage({
  kbId,
  tab,
}: {
  kbId: string;
  tab: KnowledgeBaseDetailTabKey;
}) {
  const goBack = useBackOrFallback("knowledge-base");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("knowledge-base", kbId),
        action: "知识库加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["knowledge-base", kbId],
    queryFn: () => getKnowledgeBase(kbId),
  });
  const vectorStores = useQuery({
    meta: {
      errorNotification: {
        id: withId("knowledge-vector-stores", kbId),
        action: "关联向量存储加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["vector-stores", "knowledge-base", kbId],
    queryFn: () => listVectorStores({ limit: 100 }),
  });
  const { actions } = useKnowledgeBaseActions(goBack);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const kb = detail.data;
  const relatedVectorStore = (vectorStores.data?.items ?? []).find(
    (item: VectorStore) => item.knowledge_base_ref?.id === kb.id,
  ) as VectorStore | undefined;
  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/kb"), { label: kb.name }]}
      title={kb.name}
      status={<StatusBadge status={kb.status} />}
      icon={<AliIcon name="zhishiku" size={28} />}
      headerItems={[{ label: "文档数", value: String(kb.doc_count ?? 0) }]}
      actions={<ResourceActionMenu record={kb} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={kb.id} /> },
            { label: "描述", value: kb.description || "-" },
            { label: "向量化模型", value: kb.embedding_model || "-" },
            {
              label: "默认推理模型",
              value: kb.default_inference_service || "平台默认模型",
            },
            { label: "分块大小", value: kb.chunk_size ?? "-" },
            { label: "默认 TopK", value: kb.top_k ?? "-" },
            { label: "相似度阈值", value: kb.score_threshold ?? "-" },
            { label: "创建时间", value: formatDateTime(kb.created_at) },
            { label: "更新时间", value: formatDateTime(kb.updated_at) },
          ],
        },
        {
          key: "related-summary",
          title: "关联摘要",
          fields: [
            { label: "文档", value: `${kb.doc_count ?? 0} 个` },
            {
              label: "向量存储",
              value: vectorStores.isLoading
                ? "加载中"
                : vectorStores.error
                  ? "-"
                  : relatedVectorStore
                    ? relatedVectorStore.name || relatedVectorStore.id
                    : "暂无关联向量存储",
            },
          ],
        },
      ]}
      tabs={[
        {
          key: "documents",
          label: "文档与解析",
          content: (
            <KnowledgeDocuments
              kbId={kbId}
              action={<KnowledgeDocumentUploadButton kbId={kbId} />}
            />
          ),
        },
        {
          key: "chat",
          label: "问答",
          content: (
            <KnowledgeChat
              kbId={kbId}
              defaultTopK={kb.top_k ?? 5}
              defaultInferenceService={kb.default_inference_service || undefined}
            />
          ),
        },
        {
          key: "permissions",
          label: "权限",
          content: <KnowledgePermissions kbId={kbId} />,
        },
        {
          key: "history",
          label: "操作记录",
          content: <KnowledgeBaseAuditLogs kbId={kbId} />,
        },
      ]}
      defaultTabKey={tab}
      onBack={goBack}
    />
  );
}

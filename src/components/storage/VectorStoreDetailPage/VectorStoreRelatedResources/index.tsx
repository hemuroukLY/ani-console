import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVectorStoreKnowledgeBaseLink, type VectorStore } from "@/api/storage/vector-stores";
import { DataTable, type RowAction } from "@/components/common";
import { navigateToResourceDetail } from "@/lib/resources";
import { Alert, Button, Empty, Link, Modal, Space } from "@arco-design/web-react";

import { useNavigate } from "@tanstack/react-router";

type RelatedResource = { id: string; type: "知识库"; name: string };

export function VectorStoreRelatedResources({ store }: { store: VectorStore }) {
  const navigate = useNavigate();

  const qc = useQueryClient();
  const unlink = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "vector-store-knowledge-base-unlink",
        action: "解除关联",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (store: VectorStore) => deleteVectorStoreKnowledgeBaseLink(store.id),
    onSuccess: (updatedStore, store) => {
      qc.setQueryData(["vector-store", store.id], updatedStore);
      void qc.invalidateQueries({ queryKey: ["vector-stores"] });
    },
  });
  const unlinkAction: RowAction<VectorStore> = {
    key: "unlink-knowledge-base",
    label: "解除关联",
    disabled: (item) => unlink.isPending || !item.knowledge_base_ref,
    loading: () => unlink.isPending,
    onClick: (item) => {
      if (unlink.isPending || !item.knowledge_base_ref) return;
      Modal.confirm({
        title: "解除知识库关联",
        content:
          "确定解除向量存储「" +
          item.name +
          "」与知识库「" +
          item.knowledge_base_ref.name +
          "」的关联？",
        onOk: () => unlink.mutateAsync(item),
      });
    },
  };

  const resources: RelatedResource[] = store.knowledge_base_ref
    ? [
        {
          id: store.knowledge_base_ref.id,
          type: "知识库",
          name: store.knowledge_base_ref.name,
        },
      ]
    : [];

  return (
    <Space direction="vertical" size={12} className="w-full">
      <Alert type="info" showIcon title="删除向量存储前需解除知识库关联" />
      <section>
        <DataTable<RelatedResource>
          header={{ title: "关联资源" }}
          data={resources}
          rowKey="id"
          pagination={false}
          noDataElement={<Empty description="暂无关联资源" />}
          tableLabel="向量存储关联资源列表"
          columns={[
            { title: "类型", dataIndex: "type", width: 160 },
            {
              title: "名称",
              render: (_, resource) => (
                <Link
                  onClick={() =>
                    navigateToResourceDetail(navigate, {
                      type: "knowledge-base",
                      id: resource.id,
                      search: { tab: "overview" },
                    })
                  }
                >
                  {resource.name || resource.id}
                </Link>
              ),
            },
            {
              title: "操作",
              width: 160,
              render: () => (
                <Button
                  type="text"
                  size="small"
                  loading={unlinkAction.loading?.(store)}
                  onClick={() => unlinkAction.onClick(store)}
                  disabled={unlinkAction.disabled?.(store)}
                >
                  解除关联
                </Button>
              ),
            },
          ]}
        />
      </section>
    </Space>
  );
}

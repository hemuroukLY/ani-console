import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rebuildVectorStoreIndex, type VectorStore } from "@/api/storage/vector-stores";
import { useResourceDelete } from "@/hooks/useResourceDelete";
import type { RowAction } from "@/components/common";

export function useVectorStoreActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const remove = useResourceDelete<VectorStore>("vector-store", () => {
    if (onDeleted) onDeleted();
    else void qc.invalidateQueries({ queryKey: ["vector-stores"] });
  });
  const rebuild = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "vector-index-rebuild",
        action: "重建",
        successText: "索引重建已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (item: VectorStore) => rebuildVectorStoreIndex(item.id),
    onSuccess: (_, item) => {
      void qc.invalidateQueries({ queryKey: ["vector-stores"] });
      void qc.invalidateQueries({ queryKey: ["vector-store", item.id] });
    },
  });
  const busy = () => remove.isPending || rebuild.isPending;
  const actions: RowAction<VectorStore>[] = [
    {
      key: "rebuild-index",
      label: "重建索引",
      disabled: (item) => busy() || item.state !== "ready",
      tooltip: (item) => (item.state === "ready" ? undefined : "仅可用状态支持重建索引"),
      loading: (item) => rebuild.isPending && rebuild.variables?.id === item.id,
      onClick: (item) => {
        if (busy() || item.state !== "ready") return;
        Modal.confirm({
          title: "重建索引",
          content: `确定重建「${item.name}」的索引？重建期间检索能力可能暂时受影响。`,
          onOk: () => rebuild.mutateAsync(item),
        });
      },
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (item) => busy() || remove.isDisabled(item),
      tooltip: (item) => (item.knowledge_base_ref ? "请先解除知识库关联后再删除" : undefined),
      onClick: (item) => {
        if (!busy()) remove.confirm(item);
      },
    },
  ];
  return { actions };
}

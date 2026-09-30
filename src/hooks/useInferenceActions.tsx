import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyInferenceServiceLifecycle, type InferenceService } from "@/api/ai-services/inference";
import type { RowAction } from "@/components/common";
import { useResourceDelete } from "@/hooks/useResourceDelete";
import { InferenceScaleModal } from "@/components/ai-services/InferenceScaleModal";

export function useInferenceActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const [scaleTarget, setScaleTarget] = useState<InferenceService>();
  const lifecycle = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "inference-lifecycle",
        action: "操作",
        successText: "生命周期操作已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: ({
      item,
      action,
    }: {
      item: InferenceService;
      action: "start" | "stop" | "restart";
    }) => applyInferenceServiceLifecycle(item.id, { action }),
    onSuccess: (_, { item }) => {
      void qc.invalidateQueries({ queryKey: ["inference-service", item.id] });
      void qc.invalidateQueries({ queryKey: ["inference-services"] });
    },
  });
  const remove = useResourceDelete<InferenceService>("inference-service", () => {
    if (onDeleted) onDeleted();
    else void qc.invalidateQueries({ queryKey: ["inference-services"] });
  });
  const busy = () => lifecycle.isPending || remove.isPending;
  const actions: RowAction<InferenceService>[] = [
    {
      key: "lifecycle",
      label: (item) => (item.status === "running" ? "停止" : "启动"),
      widthLabel: "启动",
      disabled: (item) => busy() || !["running", "stopped"].includes(item.status),
      onClick: (item) =>
        lifecycle.mutate({ item, action: item.status === "running" ? "stop" : "start" }),
    },
    {
      key: "restart",
      label: "重启",
      disabled: (item) => busy() || !["running", "failed"].includes(item.status),
      onClick: (item) => lifecycle.mutate({ item, action: "restart" }),
    },
    {
      key: "scale",
      label: "调整副本",
      disabled: (item) => busy() || item.status !== "running",
      onClick: setScaleTarget,
    },
    { key: "delete", label: "删除", intent: "danger", disabled: busy, onClick: remove.confirm },
  ];
  const dialogNode = scaleTarget ? (
    <InferenceScaleModal
      serviceId={scaleTarget.id}
      initialReplicas={scaleTarget.replicas}
      onCancel={() => setScaleTarget(undefined)}
    />
  ) : null;
  return { actions, dialogNode };
}

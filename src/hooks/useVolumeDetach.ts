import { applyInstanceLifecycle } from "@/api/instances";
import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
type DetachTarget = {
  volumeId: string;
  volumeName: string;
  instanceId: string;
  instanceName?: string;
};
export function useVolumeDetach() {
  const qc = useQueryClient();
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "volume-detach",
        action: "卸载",
        errorFallback: "请求失败",
      },
    },
    mutationFn: ({ volumeId, instanceId }: DetachTarget) =>
      applyInstanceLifecycle(instanceId, { action: "detach_volume", volume_id: volumeId }),
    onSuccess: (_, { volumeId }) => {
      void qc.invalidateQueries({ queryKey: ["instances"] });
      void qc.invalidateQueries({ queryKey: ["volume", volumeId] });
      void qc.invalidateQueries({ queryKey: ["volumes"] });
    },
  });
  const confirm = (target: DetachTarget) => {
    if (mutation.isPending) return;
    Modal.confirm({
      title: "卸载块存储卷",
      content: `确定从「${target.instanceName || target.instanceId}」卸载「${target.volumeName}」？请先确保实例内没有进程正在读写该卷。`,
      okButtonProps: { status: "danger" },
      onOk: () => mutation.mutateAsync(target),
    });
  };
  return { ...mutation, confirm };
}

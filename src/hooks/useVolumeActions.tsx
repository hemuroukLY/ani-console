import { useQueryClient } from "@tanstack/react-query";
import { VolumeOSInitGuideModal } from "@/components/storage/VolumeOSInitGuideModal";
import { useVolumeDetach } from "@/hooks/useVolumeDetach";
import { useResourceDelete } from "@/hooks/useResourceDelete";
import { useState } from "react";
import { type StorageVolume } from "@/api/storage/volumes";
import { CreateVolumeSnapshotModal } from "@/components/storage/CreateVolumeSnapshotModal";
import { ExpandVolumeModal } from "@/components/storage/ExpandVolumeModal";
import { AttachVolumeModal } from "@/components/storage/AttachVolumeModal";
import type { RowAction } from "@/components/common";
type Volume = StorageVolume;
export function useVolumeActions(onDeleted?: (item: Volume) => void) {
  const [attachTarget, setAttachTarget] = useState<Volume | null>(null);
  const [expandTarget, setExpandTarget] = useState<Volume | null>(null);
  const [snapshotTarget, setSnapshotTarget] = useState<{ id: string } | null>(null);
  const [initGuideId, setInitGuideId] = useState<string>();
  const qc = useQueryClient();
  const deleteVolume = useResourceDelete<Volume>("volume", (item) => {
    if (onDeleted) onDeleted(item);
    else void qc.invalidateQueries({ queryKey: ["volumes"] });
  });
  const detachVolume = useVolumeDetach();
  const isMounted = (item: Volume) => Boolean(item.mount_instance_id);
  const actions: RowAction<Volume>[] = [
    { key: "os-init", label: "初始化引导", onClick: (item) => setInitGuideId(item.id) },
    {
      key: "expand",
      label: "扩容",
      onClick: setExpandTarget,
    },
    {
      key: "mount",
      label: "挂载",
      visible: (item) => !isMounted(item),
      onClick: setAttachTarget,
    },
    {
      key: "unmount",
      label: "卸载",
      intent: "danger",
      visible: isMounted,
      loading: (item) => detachVolume.isPending && detachVolume.variables?.volumeId === item.id,
      onClick: (item) =>
        void detachVolume.confirm({
          volumeId: item.id,
          volumeName: item.name,
          instanceId: item.mount_instance_id!,
          instanceName: item.mount_name ?? undefined,
        }),
    },
    {
      key: "snapshot",
      label: "创建快照",
      onClick: setSnapshotTarget,
    },
    {
      key: "delete",
      label: "删除",
      disabled: deleteVolume.isDisabled,
      loading: (item) => deleteVolume.isPending && deleteVolume.variables?.id === item.id,
      intent: "danger",
      onClick: (item) => void deleteVolume.confirm(item),
    },
  ];
  const dialogNode = (
    <>
      {initGuideId && (
        <VolumeOSInitGuideModal volumeId={initGuideId} onCancel={() => setInitGuideId(undefined)} />
      )}
      {attachTarget && (
        <AttachVolumeModal volume={attachTarget} onCancel={() => setAttachTarget(null)} />
      )}
      {expandTarget && (
        <ExpandVolumeModal volume={expandTarget} onCancel={() => setExpandTarget(null)} />
      )}
      {snapshotTarget && (
        <CreateVolumeSnapshotModal
          volumeId={snapshotTarget.id}
          onCancel={() => setSnapshotTarget(null)}
        />
      )}
    </>
  );
  return {
    actions,
    dialogNode,
    openAttach: setAttachTarget,
    openSnapshot: (volumeId: string) => setSnapshotTarget({ id: volumeId }),
  };
}

import { useQueryClient } from "@tanstack/react-query";
import { useResourceDelete } from "@/hooks/useResourceDelete";
import { useState } from "react";
import { type StorageFilesystem } from "@/api/storage/filesystems";
import { CreateFilesystemMountTargetModal } from "@/components/storage/CreateFilesystemMountTargetModal";
import { ExpandFilesystemModal } from "@/components/storage/ExpandFilesystemModal";
import type { RowAction } from "@/components/common";
type Filesystem = StorageFilesystem;
export function useFilesystemActions(onDeleted?: (item: Filesystem) => void) {
  const [expandTarget, setExpandTarget] = useState<Filesystem | null>(null);
  const [mountTargetFilesystem, setMountTargetFilesystem] = useState<{ id: string } | null>(null);
  const qc = useQueryClient();
  const remove = useResourceDelete<Filesystem>("filesystem", (item) => {
    if (onDeleted) onDeleted(item);
    else void qc.invalidateQueries({ queryKey: ["filesystems"] });
  });

  const actions: RowAction<Filesystem>[] = [
    {
      key: "expand",
      label: "扩容",
      onClick: setExpandTarget,
    },
    {
      key: "mount-target",
      label: "添加挂载点",
      onClick: setMountTargetFilesystem,
    },
    {
      key: "delete",
      label: "删除",
      disabled: remove.isDisabled,
      loading: (item) => remove.isPending && remove.variables?.id === item.id,
      intent: "danger",
      onClick: (item) => void remove.confirm(item),
    },
  ];
  const dialogNode = (
    <>
      {expandTarget && (
        <ExpandFilesystemModal filesystem={expandTarget} onCancel={() => setExpandTarget(null)} />
      )}
      {mountTargetFilesystem && (
        <CreateFilesystemMountTargetModal
          filesystemId={mountTargetFilesystem.id}
          onCancel={() => setMountTargetFilesystem(null)}
        />
      )}
    </>
  );
  return {
    actions,
    dialogNode,
    openMountTarget: (id: string) => setMountTargetFilesystem({ id }),
  };
}

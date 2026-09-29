import type { StorageVolumeMode } from "@/api/storage/volumes";

export const VOLUME_MODE_LABELS: Record<StorageVolumeMode, string> = {
  block: "VM 数据盘",
  filesystem: "容器目录",
};

export function canMountVolumeMode(mode: StorageVolumeMode | undefined, instanceKind: string) {
  if (instanceKind === "vm") return mode === "block";
  return (
    (instanceKind === "container" || instanceKind === "gpu_container") && mode === "filesystem"
  );
}

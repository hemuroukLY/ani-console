import type { InstanceRecord } from "@/api/instances";
import { Button } from "@arco-design/web-react";
import { useState } from "react";
import { ContainerInstanceUpdateImageModal } from "@/components/instances/ContainerInstanceActions/ContainerInstanceUpdateImageModal";
import { GpuInstanceUpdateImageModal } from "@/components/instances/GpuInstanceActions/GpuInstanceUpdateImageModal";

type Instance = InstanceRecord;

export function InstanceReleaseActions({
  instance,
  onChanged,
}: {
  instance: Instance;
  onChanged: () => void;
}) {
  const [updateImageVisible, setUpdateImageVisible] = useState(false);
  const busy = ["pending", "provisioning", "starting", "stopping", "deleting"].includes(
    instance.state,
  );
  const UpdateImageModal =
    instance.kind === "gpu_container"
      ? GpuInstanceUpdateImageModal
      : ContainerInstanceUpdateImageModal;
  return (
    <>
      <Button disabled={busy} onClick={() => setUpdateImageVisible(true)}>
        更新镜像
      </Button>
      {updateImageVisible && (
        <UpdateImageModal
          instance={instance}
          onCancel={() => setUpdateImageVisible(false)}
          onSubmitted={() => {
            setUpdateImageVisible(false);
            onChanged();
          }}
        />
      )}
    </>
  );
}

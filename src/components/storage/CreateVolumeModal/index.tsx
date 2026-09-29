import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Input, InputNumber, Modal, Select, Switch } from "@arco-design/web-react";
import { useEffect, useState } from "react";
import { listInstances, type InstanceRecord } from "@/api/instances";
import { createVolume, type StorageVolume, type StorageVolumeMode } from "@/api/storage/volumes";
import { canMountVolumeMode } from "@/lib/volumes";
import { validateForm } from "@/lib/form";
import { VolumeMountFields } from "@/components/storage/VolumeMountFields";

type Volume = StorageVolume;
type Instance = InstanceRecord;

const STORAGE_CLASS_OPTIONS = [{ value: "ani-block", label: "SSD云盘" }];

const INSTANCE_ROUTE: Record<string, string> = {
  vm: "/vm-instances",
  container: "/container-instances",
  gpu_container: "/gpu-instances",
};

export function CreateVolumeModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated?: (volume: Volume) => void;
}) {
  const qc = useQueryClient();
  const [form] = Form.useForm<{ name: string; sizeGiB: number }>();
  const [storageClass, setStorageClass] = useState("ani-block");
  const [encrypted, setEncrypted] = useState(false);
  const [volumeMode, setVolumeMode] = useState<StorageVolumeMode>("filesystem");
  const [mountInstanceId, setMountInstanceId] = useState("");
  const instances = useQuery({
    meta: {
      errorNotification: {
        id: "instances",
        action: "实例列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["instances", "volume-create"],
    queryFn: () => listInstances({ limit: 100, mountable: true }),
  });
  // TODO: 实例接口确认按 mountable 过滤后，移除此处创建表单的本地兜底过滤。
  const instanceItems = ((instances.data?.items ?? []) as Instance[]).filter((item) =>
    canMountVolumeMode(volumeMode, item.kind),
  );
  useEffect(() => {
    if (!mountInstanceId || instanceItems.some((item) => item.id === mountInstanceId)) return;
    setMountInstanceId("");
  }, [instanceItems, mountInstanceId]);
  const reset = () => {
    setStorageClass("ani-block");
    setEncrypted(false);
    setVolumeMode("filesystem");
    setMountInstanceId("");
  };
  const create = useMutation({
    meta: { feedback: { channel: "message", action: "创建", errorFallback: "请求失败" } },
    mutationFn: async ({ name, sizeGiB }: { name: string; sizeGiB: number }) => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("请输入卷名称");
      if (!Number.isInteger(sizeGiB) || sizeGiB < 1)
        throw new Error("容量必须是大于 0 的整数（GiB）");
      if (!storageClass.trim()) throw new Error("请选择云盘类型");
      const selectedInstance = instanceItems.find((item) => item.id === mountInstanceId);
      const submitData = {
        name: trimmedName,
        size_gib: sizeGiB,
        storage_class: storageClass.trim(),
        volume_mode: volumeMode,
        encrypted,
        mount_instance_id: selectedInstance ? selectedInstance.id : undefined,
        mount_route: selectedInstance ? INSTANCE_ROUTE[selectedInstance.kind] : undefined,
      };
      return createVolume(submitData);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["volumes"] });
      reset();
      onCreated?.(data);
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建块存储卷"
      onCancel={() => {
        reset();
        onCancel();
      }}
      onOk={async () => create.mutateAsync(await validateForm(form))}
      confirmLoading={create.isPending}
      unmountOnExit
    >
      <Form form={form} layout="vertical" initialValues={{ name: "", sizeGiB: 40 }}>
        <Form.Item
          label="名称"
          required
          rules={[
            {
              validator: (value, callback) => callback(value?.trim() ? undefined : "请输入卷名称"),
            },
          ]}
          field="name"
        >
          <Input placeholder="请输入卷名称" maxLength={64} showWordLimit />
        </Form.Item>
        <Form.Item
          label="容量 (GiB)"
          required
          field="sizeGiB"
          rules={[
            {
              validator: (value, callback) =>
                callback(
                  Number.isInteger(value) && value >= 1
                    ? undefined
                    : "容量必须是大于 0 的整数（GiB）",
                ),
            },
          ]}
        >
          <InputNumber min={1} precision={0} className="w-full" />
        </Form.Item>
        <Form.Item label="云盘类型" required>
          <Select value={storageClass} onChange={setStorageClass} placeholder="请选择云盘类型">
            {STORAGE_CLASS_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="是否加密">
          <Switch checked={encrypted} onChange={setEncrypted} />
        </Form.Item>
        <VolumeMountFields
          mode={volumeMode}
          instanceId={mountInstanceId}
          instances={instanceItems}
          loading={instances.isLoading}
          onModeChange={setVolumeMode}
          onInstanceChange={setMountInstanceId}
        />
      </Form>
    </Modal>
  );
}

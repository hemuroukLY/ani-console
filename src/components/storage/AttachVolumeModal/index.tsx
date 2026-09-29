import { applyInstanceLifecycle, listInstances, type InstanceRecord } from "@/api/instances";
import { withId } from "@/lib/id";
import type { StorageVolume } from "@/api/storage/volumes";
import { canMountVolumeMode, VOLUME_MODE_LABELS } from "@/lib/volumes";
import { Form, Modal, Select, Typography } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Instance = InstanceRecord;

export function AttachVolumeModal({
  volume,
  onCancel,
  onAttached,
}: {
  volume: StorageVolume;
  onCancel: () => void;
  onAttached?: () => void;
}) {
  const qc = useQueryClient();
  const volumeId = volume.id;
  const [instanceId, setInstanceId] = useState("");
  const instances = useQuery({
    meta: {
      errorNotification: {
        id: withId("instances", "volume-attach"),
        action: "实例列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["instances", "volume-attach"],
    queryFn: () =>
      listInstances({
        limit: 100,
        kind: "vm,container,gpu_container",
        state: "running,stopped",
      }),
  });
  // TODO: 实例接口确认按 kind/state 过滤后，移除此处关联资源选择的本地兜底过滤。
  const instanceItems = ((instances.data?.items ?? []) as Instance[]).filter(
    (item) =>
      canMountVolumeMode(volume.volume_mode, item.kind) &&
      ["running", "stopped"].includes(item.state),
  );

  useEffect(() => {
    if (!instanceId || instanceItems.some((item) => item.id === instanceId)) return;
    setInstanceId("");
  }, [instanceId, instanceItems]);

  const attach = useMutation({
    meta: { feedback: { channel: "message", action: "挂载", errorFallback: "请求失败" } },
    mutationFn: () => {
      if (!instanceItems.some((item) => item.id === instanceId))
        throw new Error("请选择与卷用途匹配的挂载实例");
      return applyInstanceLifecycle(instanceId, {
        action: "attach_volume",
        volume_id: volumeId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instances"] });
      qc.invalidateQueries({ queryKey: ["volume", volumeId] });
      qc.invalidateQueries({ queryKey: ["volumes"] });
      onAttached?.();
      onCancel();
    },
  });

  return (
    <Modal
      visible
      title="挂载块存储卷"
      onCancel={onCancel}
      onOk={() => attach.mutateAsync()}
      okButtonProps={{ disabled: !instanceId }}
      confirmLoading={attach.isPending}
      unmountOnExit
    >
      <Form layout="vertical">
        <Form.Item
          label="目标实例"
          required
          extra={`卷用途：${VOLUME_MODE_LABELS[volume.volume_mode] ?? "未知"}。仅显示用途匹配的实例；用途不可修改。`}
        >
          <Select
            value={instanceId || undefined}
            onChange={setInstanceId}
            loading={instances.isLoading}
            placeholder="请选择用途匹配且运行中或已停止的实例"
            showSearch
            filterOption={(inputValue, option) =>
              String(option.props.children).toLowerCase().includes(inputValue.toLowerCase())
            }
          >
            {instanceItems.map((item) => (
              <Select.Option key={item.id} value={item.id}>
                {item.name} · {item.kind} · {item.state}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Typography.Text type="secondary">
          挂载操作提交后，卷状态和关联实例会自动刷新。
        </Typography.Text>
      </Form>
    </Modal>
  );
}

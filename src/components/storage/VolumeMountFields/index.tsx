import type { InstanceRecord } from "@/api/instances";
import type { StorageVolumeMode } from "@/api/storage/volumes";
import { VOLUME_MODE_LABELS } from "@/lib/volumes";
import { Form, Select } from "@arco-design/web-react";

export function VolumeMountFields({
  mode,
  instanceId,
  instances,
  loading,
  onModeChange,
  onInstanceChange,
}: {
  mode: StorageVolumeMode;
  instanceId: string;
  instances: InstanceRecord[];
  loading: boolean;
  onModeChange: (mode: StorageVolumeMode) => void;
  onInstanceChange: (id: string) => void;
}) {
  return (
    <>
      <Form.Item label="用途" required extra="用途创建后不可修改。如需更换用途，须重新创建卷。">
        <Select
          value={mode}
          onChange={(value: StorageVolumeMode) => {
            onModeChange(value);
            onInstanceChange("");
          }}
          options={[
            { value: "filesystem", label: VOLUME_MODE_LABELS.filesystem },
            { value: "block", label: VOLUME_MODE_LABELS.block },
          ]}
        />
      </Form.Item>
      <Form.Item label="挂载实例">
        <Select
          value={instanceId || undefined}
          onChange={(value) => onInstanceChange(value ?? "")}
          loading={loading}
          allowClear
          placeholder="可选，创建后挂载到用途匹配的实例"
          showSearch
          filterOption={(inputValue, option) =>
            String(option.props.children).toLowerCase().includes(inputValue.toLowerCase())
          }
        >
          {instances.map((item) => (
            <Select.Option key={item.id} value={item.id}>
              {item.name} · {item.kind}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
}

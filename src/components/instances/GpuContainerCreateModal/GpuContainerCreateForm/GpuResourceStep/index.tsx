import { StatusBadge } from "@/components/common";
import { InstanceComputeSpecSelect } from "@/components/instances/InstanceComputeSpecSelect";
import { Form, Input, Select, Tag } from "@arco-design/web-react";
import { type FormValues, type GpuSpecOption, isGpuSpecSelectable } from "../../types";

function specStatusTag(spec: GpuSpecOption) {
  if (spec.source === "temporary") {
    return <Tag color="blue">{spec.gpu_mode === "wholecard" ? "整卡" : "vGPU"}</Tag>;
  }

  switch (spec.availability?.status) {
    case "available":
      return <StatusBadge tone="success">剩余 {spec.availability.available_count}</StatusBadge>;
    case "full":
      return <StatusBadge tone="neutral">配额已满</StatusBadge>;
    case "device_full":
      return <StatusBadge tone="warning">设备已满</StatusBadge>;
    case "unavailable":
      return <StatusBadge tone="neutral">暂无匹配节点</StatusBadge>;
  }
}

export function GpuResourceStep({
  specs,
  specsLoading,
}: {
  values: FormValues;
  specs: GpuSpecOption[];
  quotaRemaining: number;
  specsLoading: boolean;
}) {
  return (
    <>
      <Form.Item
        field="spec_id"
        label="GPU 规格"
        rules={[{ required: true, message: "请选择 GPU 规格" }]}
      >
        <Select loading={specsLoading} placeholder="请选择可用 GPU 规格" showSearch allowClear>
          {specs.map((spec) => (
            <Select.Option
              key={spec.spec_id}
              value={spec.spec_id}
              disabled={!isGpuSpecSelectable(spec)}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{spec.display_name}</span>
                {specStatusTag(spec)}
              </span>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <InstanceComputeSpecSelect field="compute_spec" profile="gpu" />
      <Form.Item
        field="replicas"
        label="副本"
        rules={[
          {
            required: true,
            match: /^[1-9]\d*$/,
            message: "请输入大于 0 的整数",
          },
        ]}
      >
        <Input placeholder="1" />
      </Form.Item>
    </>
  );
}

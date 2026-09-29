import { Select, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";

import {
  listInferenceServices,
  type InferenceService,
  type InferenceServiceListParams,
} from "@/api/ai-services/inference";
import { withId } from "@/lib/id";

export function KnowledgeModelSelect({
  capability,
  value,
  onChange,
}: {
  capability: NonNullable<InferenceServiceListParams["capability"]>;
  value?: string;
  onChange?: (value: string | undefined) => void;
}) {
  const models = useQuery({
    queryKey: ["inference-services", "model-options", capability, "running"],
    queryFn: async () => {
      const items: InferenceService[] = [];
      let cursor: string | undefined;
      do {
        const data = await listInferenceServices({
          limit: 100,
          cursor,
          capability,
          status: "running",
        });
        items.push(...data.items);
        cursor = data.next_cursor ?? undefined;
      } while (cursor);
      return { items };
    },
    meta: {
      errorNotification: {
        id: withId("inference-models", capability),
        action: capability === "embedding" ? "向量化模型列表加载" : "推理模型列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const options = (models.data?.items ?? []).map((service) => ({
    value: service.served_model_name,
    label: service.served_model_name,
  }));

  return (
    <Space direction="vertical" className="w-full">
      <Select
        aria-label={capability === "embedding" ? "向量化模型" : "默认推理模型"}
        value={value || undefined}
        onChange={onChange}
        onVisibleChange={(visible) => {
          if (visible) void models.refetch({ cancelRefetch: false });
        }}
        loading={models.isFetching}
        allowClear
        placeholder="使用服务端默认模型"
        showSearch
        options={options}
        filterOption={(input, option) =>
          String(option.props.children).toLowerCase().includes(input.trim().toLowerCase())
        }
      />
      {models.isSuccess && options.length === 0 ? (
        <Typography.Text type="secondary">
          当前租户没有可选择的运行中的{capability === "embedding" ? "向量化" : "文本生成"}推理服务。
          可使用服务端默认模型创建；如需指定模型，请在推理服务页面部署对应服务，
          待服务运行后重新展开选择框。
        </Typography.Text>
      ) : null}
    </Space>
  );
}

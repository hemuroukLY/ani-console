import { Button, Select, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { listModels, type ModelListParams } from "@/api/ai-services/models";
import { getReadyModelOptions } from "@/lib/ai-models";
import { withId } from "@/lib/id";

export function KnowledgeModelSelect({
  capability,
  value,
  onChange,
}: {
  capability: NonNullable<ModelListParams["capability"]>;
  value?: string;
  onChange?: (value: string | undefined) => void;
}) {
  const models = useQuery({
    queryKey: ["models", "knowledge-base-create", capability],
    queryFn: () => listModels({ limit: 100, capability, status: "ready" }),
    meta: {
      errorNotification: {
        id: withId("models", capability === "embedding" ? "embedding" : "inference"),
        action: capability === "embedding" ? "向量化模型列表加载" : "推理模型列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const options = getReadyModelOptions(models.data?.items, capability);

  return (
    <Space direction="vertical" className="w-full">
      <Select
        aria-label={capability === "embedding" ? "向量化模型" : "默认推理模型"}
        value={value || ""}
        onChange={onChange}
        loading={models.isFetching}
        showSearch
        options={[{ value: "", label: "使用服务端默认模型" }, ...options]}
        filterOption={(input, option) =>
          String(option.props.children).toLowerCase().includes(input.trim().toLowerCase())
        }
      />
      {models.isSuccess && options.length === 0 ? (
        <Typography.Text type="secondary">
          当前租户没有可选择的已就绪{capability === "embedding" ? "向量化" : "文本生成"}模型。
          可使用服务端默认模型创建；如需指定模型，请在模型仓库准备对应模型，
          并请管理员确认模型服务可用后刷新列表。
        </Typography.Text>
      ) : null}
      <Space>
        <Button size="small" loading={models.isFetching} onClick={() => void models.refetch()}>
          刷新模型列表
        </Button>
        <Link to="/models" target="_blank" rel="noopener noreferrer">
          打开模型仓库
        </Link>
      </Space>
    </Space>
  );
}

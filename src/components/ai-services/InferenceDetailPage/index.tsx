import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { useInferenceActions } from "@/hooks/useInferenceActions";

import { getInferenceService, listInferenceServicePolicies } from "@/api/ai-services/inference";
import { Link as ArcoLink, Button, Space, Typography } from "@arco-design/web-react";

import { useQuery } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";

import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ImageNameText,
  ResourceId,
} from "@/components/common";
import { copyToClipboard } from "@/lib/clipboard";
import { InferenceStatusTag } from "@/components/ai-services/InferenceStatusTag";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { InferenceInvocationTest } from "./InferenceInvocationTest";
import { InferenceEvents } from "./InferenceEvents";
import { InferenceLogs } from "./InferenceLogs";
import { InferenceMonitoring } from "./InferenceMonitoring";
import { InferencePolicies } from "./InferencePolicies";
import { InferenceRelatedResources } from "./InferenceRelatedResources";

export function InferenceDetailPage({
  serviceId,
  tab,
  onTabChange,
}: {
  serviceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("inference-service");
  const { actions, dialogNode } = useInferenceActions(goBack);

  const service = useQuery({
    meta: {
      errorNotification: {
        id: withId("inference-service", serviceId),
        action: "推理服务详情加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["inference-service", serviceId],
    queryFn: () => getInferenceService(serviceId),
  });
  const policies = useQuery({
    meta: {
      errorNotification: {
        id: withId("inference-policies", serviceId),
        action: "访问策略加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["inference-service-policies", serviceId],
    enabled: Boolean(service.data),
    queryFn: () => listInferenceServicePolicies(serviceId),
  });

  if (!service.data) {
    return <DetailPagePlaceholder loading={service.isLoading} />;
  }

  const item = service.data;
  const invocationUrl = item.invocation_url ?? item.endpoint_url;
  const compatibilityPath = (() => {
    if (!invocationUrl) return "-";
    try {
      return new URL(invocationUrl).pathname;
    } catch {
      return invocationUrl.startsWith("/") ? invocationUrl : "-";
    }
  })();
  const engineCommandText = item.engine?.command?.join(" ") || "-";
  const requestPolicy =
    policies.data?.policies.find(
      (policy) => policy.status === "enabled" && policy.rate_limits.qps != null,
    ) ??
    policies.data?.policies.find((policy) => policy.status === "enabled") ??
    policies.data?.policies[0];
  const qpsLabel = policies.isLoading
    ? "QPS 加载中…"
    : `QPS ${requestPolicy?.rate_limits.qps ?? "-"}`;
  const serviceStatus = <InferenceStatusTag {...item} />;

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/inference"), { label: item.name }]}
        title={item.name}
        status={serviceStatus}
        icon={<AliIcon name="tuili" size={28} />}
        headerItems={[
          {
            label: "已就绪副本",
            value: `${item.ready_replicas} / ${item.replicas}`,
          },
        ]}
        actions={<ResourceActionMenu record={item} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={item.id} /> },
              { label: "规格", value: "-" },
              {
                label: "模型",
                value: item.served_model_name || item.model,
              },
              {
                label: "启动命令",
                value: (
                  <span className="wrap-anywhere whitespace-pre-wrap">{engineCommandText}</span>
                ),
              },
              {
                label: "OpenAI 兼容",
                value: (
                  <Space size={4} wrap>
                    <Typography.Text code>{compatibilityPath}</Typography.Text>
                    <Typography.Text type="secondary">·</Typography.Text>
                    <Typography.Text>
                      model=<strong>{item.served_model_name || item.name}</strong>
                    </Typography.Text>
                  </Space>
                ),
              },
              {
                label: "调用地址",
                value: invocationUrl ? (
                  <Space size={4} wrap>
                    <ArcoLink href={invocationUrl} target="_blank" rel="noreferrer">
                      {invocationUrl}
                    </ArcoLink>
                    <Button
                      type="text"
                      size="mini"
                      onClick={() => void copyToClipboard(invocationUrl, "调用地址")}
                    >
                      复制
                    </Button>
                  </Space>
                ) : (
                  "-"
                ),
              },
              {
                label: "请求限流",
                value: (
                  <Space size={4} wrap>
                    <Typography.Text>{qpsLabel}</Typography.Text>
                    <Typography.Text type="secondary">·</Typography.Text>
                    <Typography.Text>并发 {item.max_concurrency ?? "-"}</Typography.Text>
                    <Typography.Text type="secondary">·</Typography.Text>
                    <Button type="text" size="mini" onClick={() => onTabChange("policies")}>
                      配置
                    </Button>
                  </Space>
                ),
              },
              { label: "创建时间", value: formatDateTime(item.created_at) },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: [
              {
                label: "模型",
                value: item.served_model_name || item.model,
              },
              {
                label: "模型版本",
                value: item.model_version_id ?? "-",
              },
              {
                label: "运行镜像",
                value: <ImageNameText image={item.image_ref ?? item.image_id} />,
              },
            ],
          },
        ]}
        tabs={[
          {
            key: "related",
            label: "关联资源",
            content: <InferenceRelatedResources service={item} />,
          },
          {
            key: "policies",
            label: "策略",
            content: <InferencePolicies serviceId={item.id} />,
          },
          {
            key: "invocation-test",
            label: "调用测试",
            content: (
              <InferenceInvocationTest
                servedModelName={item.served_model_name || item.name}
                status={item.status}
                endpointUrl={item.invocation_url ?? item.endpoint_url}
              />
            ),
          },
          {
            key: "monitoring",
            label: "监控",
            content: <InferenceMonitoring />,
          },
          {
            key: "logs",
            label: "日志",
            content: <InferenceLogs serviceId={item.id} />,
          },
          {
            key: "events",
            label: "事件",
            content: <InferenceEvents />,
          },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}

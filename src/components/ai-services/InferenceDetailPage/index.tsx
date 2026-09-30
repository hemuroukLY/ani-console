import {
  applyInferenceServiceLifecycle,
  deleteInferenceService,
  getInferenceService,
  listInferenceServicePolicies,
} from "@/api/ai-services/inference";
import {
  Link as ArcoLink,
  Button,
  Dropdown,
  Menu,
  Modal,
  Space,
  Typography,
} from "@arco-design/web-react";
import { IconMoreVertical } from "@arco-design/web-react/icon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useState } from "react";

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
import { InferenceScaleModal } from "./InferenceScaleModal";

type LifecycleAction = "start" | "stop" | "restart";

export function InferenceDetailPage({ serviceId }: { serviceId: string }) {
  const goBack = useBackOrFallback("inference-service");
  const qc = useQueryClient();
  const [scaleVisible, setScaleVisible] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("related");

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

  const lifecycle = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "inference-lifecycle",
        action: "操作",
        successText: "生命周期操作已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async (action: LifecycleAction) => {
      const submitData = { action };
      return applyInferenceServiceLifecycle(serviceId, submitData);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["inference-service", serviceId],
      });
      void qc.invalidateQueries({ queryKey: ["inference-services"] });
    },
  });
  const remove = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "inference-delete",
        action: "删除",
        successText: "删除操作已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: () => deleteInferenceService(serviceId),
    onSuccess: goBack,
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
  const actions = (
    <Dropdown
      trigger="click"
      position="br"
      droplist={
        <Menu>
          {item.status === "running" ? (
            <Menu.Item
              key="stop"
              disabled={lifecycle.isPending}
              onClick={() => lifecycle.mutate("stop")}
            >
              停止
            </Menu.Item>
          ) : null}
          {item.status === "stopped" ? (
            <Menu.Item
              key="start"
              disabled={lifecycle.isPending}
              onClick={() => lifecycle.mutate("start")}
            >
              启动
            </Menu.Item>
          ) : null}
          {item.status === "running" || item.status === "failed" ? (
            <Menu.Item
              key="restart"
              disabled={lifecycle.isPending}
              onClick={() => lifecycle.mutate("restart")}
            >
              重启
            </Menu.Item>
          ) : null}
          {item.status === "running" ? (
            <Menu.Item
              key="scale"
              disabled={lifecycle.isPending}
              onClick={() => setScaleVisible(true)}
            >
              调整副本
            </Menu.Item>
          ) : null}
          <Menu.Item
            key="delete"
            disabled={remove.isPending}
            style={{ color: "var(--color-danger-6)" }}
            onClick={() =>
              Modal.confirm({
                title: "删除推理服务",
                content: `确定删除「${item.name}」？删除请求提交后将异步停止并清理该服务。`,
                okButtonProps: { status: "danger" },
                onOk: () => remove.mutateAsync(),
              })
            }
          >
            删除
          </Menu.Item>
        </Menu>
      }
    >
      <Button
        disabled={lifecycle.isPending || remove.isPending}
        aria-label="更多操作"
        title="更多操作"
      >
        <IconMoreVertical />
      </Button>
    </Dropdown>
  );

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
        actions={actions}
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
                    <Button type="text" size="mini" onClick={() => setActiveTabKey("policies")}>
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
        activeTabKey={activeTabKey}
        onTabChange={setActiveTabKey}
        onBack={goBack}
      />
      {scaleVisible && (
        <InferenceScaleModal
          serviceId={serviceId}
          initialReplicas={item.replicas}
          onCancel={() => setScaleVisible(false)}
        />
      )}
    </>
  );
}

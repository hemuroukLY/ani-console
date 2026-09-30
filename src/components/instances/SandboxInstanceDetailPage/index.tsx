import { withId } from "@/lib/id";
import { getInstance } from "@/api/instances";
import { Empty } from "@arco-design/web-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ImageNameText,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { InstanceLogs } from "@/components/instances/InstanceLogs";
import { InstanceMetrics } from "@/components/instances/InstanceMetrics";
import { InstanceOperations } from "@/components/instances/InstanceOperations";
import { SandboxInstanceActions } from "@/components/instances/SandboxInstanceActions";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatBytes, formatDateTime } from "@/lib/format";
import { getSandboxProviderLabel } from "@/lib/instances";
import { SandboxAccess } from "./SandboxAccess";
import { SandboxCheckpoints } from "./SandboxCheckpoints";
import { SandboxCodeRunner } from "./SandboxCodeRunner";
import { SandboxEnvironment } from "./SandboxEnvironment";
import { SandboxEvents } from "./SandboxEvents";
import { SandboxFiles } from "./SandboxFiles";
import { formatDurationSeconds, sandboxEgressLabel, sandboxTimeoutLabel } from "./utils";

export function SandboxInstanceDetailPage({
  instanceId,
  tab,
  onTabChange,
}: {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("sandbox-instance");
  const queryClient = useQueryClient();

  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("sandbox", instanceId),
        action: "沙箱实例加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["instance", instanceId],
    queryFn: () => getInstance(instanceId),
  });
  const refreshDetail = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] }),
      queryClient.invalidateQueries({ queryKey: ["sandbox-instances"] }),
    ]);
  };

  if (!detail.data) {
    return <DetailPagePlaceholder loading={detail.isLoading} />;
  }

  const instance = detail.data;
  if (instance.kind !== "sandbox" || !instance.sandbox) {
    return <Empty description="当前资源不是沙箱实例，或缺少沙箱运行摘要" />;
  }

  const sandbox = instance.sandbox;
  const sessionState = sandbox.session_state ?? instance.state;
  const running = sessionState === "running";

  return (
    <DetailPageFrame
      breadcrumbs={[
        ...navigationBreadcrumbsForPath("/sandbox-instances"),
        { label: instance.name || instance.id },
      ]}
      title={instance.name || instance.id}
      status={<StatusBadge status={sessionState} reason={instance.reason} />}
      icon={<AliIcon name="Sandbox" size={28} />}
      headerItems={[
        {
          label: "CPU / 内存",
          value:
            [instance.compute?.cpu, instance.compute?.memory]
              .filter((value) => value != null)
              .join(" / ") || "-",
        },
      ]}
      actions={
        <SandboxInstanceActions
          instance={instance}
          onChanged={() => void refreshDetail()}
          onDeleted={goBack}
        />
      }
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={instance.id} /> },
            {
              label: "终止保护",
              value: instance.termination_protection ? "已开启" : "未开启",
            },
            {
              label: "镜像",
              value: <ImageNameText image={instance.image} />,
            },
            {
              label: "CPU / 内存",
              value:
                [instance.compute?.cpu, instance.compute?.memory]
                  .filter((value) => value != null)
                  .join(" / ") || "-",
            },
            { label: "RuntimeClass", value: sandbox.runtime_class },
            {
              label: "出口策略",
              value: sandboxEgressLabel(sandbox.network_egress_policy),
            },
            { label: "Provider", value: getSandboxProviderLabel(instance) },
            { label: "会话 TTL", value: sandbox.session_timeout },
            { label: "空闲超时", value: sandbox.idle_timeout ?? "-" },
            {
              label: "到期策略",
              value: sandboxTimeoutLabel(sandbox.on_timeout),
            },
            { label: "创建时间", value: formatDateTime(instance.created_at) },
          ],
        },
        {
          key: "related-summary",
          title: "关联摘要",
          fields: [
            { label: "关联 Agent", value: sandbox.agent_ref ?? "-" },
            {
              label: "预览端口",
              value: `${sandbox.ports?.length ?? 0} 个`,
            },
            {
              label: "检查点",
              value: `${sandbox.checkpoints?.length ?? 0} 个`,
            },
            {
              label: "环境变量",
              value: `${sandbox.env?.length ?? 0} 个`,
            },
            {
              label: "工作区文件",
              value:
                sandbox.files_summary?.file_count != null
                  ? `${sandbox.files_summary.file_count} 个 / ${formatBytes(
                      sandbox.files_summary.total_size_bytes,
                    )}`
                  : "-",
            },
            {
              label: "资源引用",
              value: instance.resource_refs?.join("、") || "-",
            },
            {
              label: "剩余时长",
              value: formatDurationSeconds(sandbox.remain_seconds),
            },
            {
              label: "空闲剩余",
              value: formatDurationSeconds(sandbox.idle_remain_seconds),
            },
            { label: "停止原因", value: sandbox.stop_reason ?? "-" },
            { label: "更新时间", value: formatDateTime(instance.updated_at) },
          ],
        },
      ]}
      tabs={[
        {
          key: "access",
          label: "访问配置",
          content: <SandboxAccess instance={instance} onChanged={() => void refreshDetail()} />,
        },
        {
          key: "env",
          label: "环境变量",
          content: <SandboxEnvironment sandbox={sandbox} />,
        },
        {
          key: "files",
          label: "文件",
          content: (
            <SandboxFiles
              instanceId={instanceId}
              running={running}
              onChanged={() => void refreshDetail()}
            />
          ),
        },
        {
          key: "code",
          label: "运行代码",
          content: (
            <SandboxCodeRunner
              instanceId={instanceId}
              running={running}
              onChanged={() => void refreshDetail()}
            />
          ),
        },
        {
          key: "checkpoints",
          label: "检查点",
          content: (
            <SandboxCheckpoints
              instanceId={instanceId}
              sessionState={sessionState}
              onChanged={() => void refreshDetail()}
            />
          ),
        },
        {
          key: "metrics",
          label: "资源监控",
          content: <InstanceMetrics instanceId={instanceId} instanceKind="sandbox" />,
        },
        {
          key: "logs",
          label: "日志",
          content: <InstanceLogs instanceId={instanceId} active />,
        },
        {
          key: "events",
          label: "事件",
          content: <SandboxEvents instanceId={instanceId} />,
        },
        {
          key: "operations",
          label: "操作记录",
          content: <InstanceOperations instanceId={instanceId} />,
        },
      ]}

      activeTabKey={tab}
      onTabChange={onTabChange}
      onBack={goBack}
    />
  );
}

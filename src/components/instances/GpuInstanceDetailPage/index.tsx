import { withId } from "@/lib/id";
import { getInstance, type InstanceRecord } from "@/api/instances";
import { Button, Empty, Space, Tooltip } from "@arco-design/web-react";
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
import { InstanceVersions } from "@/components/instances/InstanceVersions";
import { useGpuInstanceActions } from "@/hooks/useGpuInstanceActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { getImageDisplayName } from "@/lib/render";
import type { GpuInstanceDetailTabKey } from "@/lib/instances";
import { InstanceConfiguration } from "@/components/instances/InstanceConfiguration";
import { InstanceEvents } from "@/components/instances/InstanceEvents";
import { InstanceMetrics } from "@/components/instances/InstanceMetrics";
import { InstanceNetwork } from "@/components/instances/InstanceNetwork";
import { InstanceOperations } from "@/components/instances/InstanceOperations";
import { InstanceStorage } from "@/components/instances/InstanceStorage";

type Instance = InstanceRecord;

function imageLabel(instance: Instance) {
  return getImageDisplayName(instance.image);
}

function gpuLabel(instance: Instance) {
  if (!instance.gpu?.model && !instance.compute?.gpu_type) return "-";
  return `${instance.gpu?.model ?? instance.compute?.gpu_type} × ${instance.gpu?.count ?? 1}`;
}

export function GpuInstanceDetailPage({
  instanceId,
  tab,
  onTabChange,
}: {
  instanceId: string;
  tab: GpuInstanceDetailTabKey;
  onTabChange: (tab: GpuInstanceDetailTabKey) => void;
}) {
  const goBack = useBackOrFallback("gpu-instance");
  const queryClient = useQueryClient();
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("gpu-container", instanceId),
        action: "GPU 容器实例加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["gpu-instance", instanceId],
    queryFn: () => getInstance(instanceId),
  });
  const refreshInstance = () => {
    void detail.refetch();
    void queryClient.invalidateQueries({ queryKey: ["gpu-instances"] });
  };
  const { actions, dialogNode } = useGpuInstanceActions(refreshInstance, goBack);
  const primaryAction = actions.find((action) => action.key === "terminal");
  if (!detail.data) {
    return <DetailPagePlaceholder loading={detail.isLoading} />;
  }

  const instance = detail.data;
  if (instance.kind !== "gpu_container") {
    return <Empty description="当前资源不是 GPU 容器实例" />;
  }

  const nodeName = instance.compute?.node_name ?? instance.node_name ?? "-";
  const gpuModel = instance.gpu?.model ?? instance.compute?.gpu_type;
  const gpuCount = instance.gpu?.count ?? 1;
  const cpu = instance.compute?.cpu;
  const memory = instance.compute?.memory;
  const cpuMemory =
    cpu != null || memory != null
      ? `${cpu != null ? `${String(cpu).replace(/C$/i, "")}C` : "-"}${
          memory != null ? String(memory).replace(/Gi$/i, "G").replace(/^\s+/, "") : "-"
        }`
      : "-";
  const rolloutLabels: Record<string, string> = {
    pending: "待发布",
    progressing: "发布中",
    healthy: "健康",
    degraded: "异常",
    rolled_back: "已回滚",
  };
  const workloadIdentity = instance.workload_identity;
  const workloadIdentityLabel = workloadIdentity?.active
    ? [workloadIdentity.key_prefix, ...(workloadIdentity.scopes ?? [])]
        .filter(Boolean)
        .join(" · ") || "-"
    : "-";
  const securityGroups = instance.network?.security_groups ?? [];
  const loadBalancerRefs = instance.network?.load_balancer_refs ?? [];
  const rollbackAction = actions.find((action) => action.key === "rollback");
  const relatedItems: Array<{
    key: string;
    kind: string;
    name: string;
    id?: string;
  }> = [];
  const relatedKeys = new Set<string>();
  const addRelated = (item: (typeof relatedItems)[number]) => {
    if (relatedKeys.has(item.key)) return;
    relatedKeys.add(item.key);
    relatedItems.push(item);
  };
  if (instance.network?.vpc_id ?? instance.vpc_id) {
    const id = String(instance.network?.vpc_id ?? instance.vpc_id);
    addRelated({
      key: `vpc/${id}`,
      kind: "VPC",
      name: instance.network?.vpc_name ?? id,
      id,
    });
  }
  if (instance.network?.subnet_id ?? instance.subnet_id) {
    const id = String(instance.network?.subnet_id ?? instance.subnet_id);
    addRelated({
      key: `subnet/${id}`,
      kind: "子网",
      name: instance.network?.subnet_name ?? id,
      id,
    });
  }
  securityGroups.forEach((group) =>
    addRelated({
      key: `security-group/${group.id}`,
      kind: "安全组",
      name: group.name ?? group.id,
      id: group.id,
    }),
  );
  (instance.volumes ?? []).forEach((volume) => {
    const id = volume.source_ref?.replace(/^volume\//, "");
    addRelated({
      key: volume.source_ref ?? `volume/${volume.name}`,
      kind: "云盘",
      name: volume.name,
      id,
    });
  });
  (instance.storage_attachments ?? []).forEach((attachment) => {
    const isFilesystem = attachment.resource_type === "filesystem";
    addRelated({
      key: `${attachment.resource_type}/${attachment.resource_id}`,
      kind: isFilesystem ? "文件存储" : attachment.resource_type,
      name: attachment.resource_name ?? attachment.resource_id,
      id: attachment.resource_id,
    });
  });
  if (instance.image?.id) {
    addRelated({
      key: `image/${instance.image.id}`,
      kind: "镜像",
      name: imageLabel(instance),
      id: instance.image.id,
    });
  }
  (instance.resource_refs ?? [])
    .filter((reference) => /secret|key|credential/i.test(reference))
    .forEach((reference) =>
      addRelated({
        key: reference,
        kind: "密钥",
        name: reference,
      }),
    );
  loadBalancerRefs.forEach((reference) =>
    addRelated({
      key: `load-balancer/${reference}`,
      kind: "负载均衡",
      name: reference,
      id: reference,
    }),
  );

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/gpu-instances"), { label: instance.name }]}
        title={instance.name}
        status={<StatusBadge status={instance.state} reason={instance.reason} />}
        icon={<AliIcon name="GPUrongqishili" size={28} />}
        headerItems={[{ label: "GPU", value: gpuLabel(instance) }]}
        actions={
          <Space>
            <Button
              type="primary"
              disabled={!primaryAction || primaryAction.disabled?.(instance)}
              loading={primaryAction?.loading?.(instance)}
              onClick={() => primaryAction?.onClick(instance)}
            >
              远程终端
            </Button>
            <ResourceActionMenu
              record={instance}
              actions={actions.filter((action) => action.key !== "terminal")}
            />
          </Space>
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
                label: "规格",
                value: gpuModel ? `${gpuCount}×${gpuModel}` : "-",
              },
              { label: "镜像", value: <ImageNameText image={instance.image} /> },
              { label: "Provider", value: instance.provider },
              { label: "节点", value: nodeName },
              { label: "CPU / 内存", value: cpuMemory },
              { label: "GPU", value: gpuLabel(instance) },
              {
                label: "副本",
                value: instance.container
                  ? `${instance.container.ready_replicas} / ${instance.container.replicas}`
                  : "-",
              },
              {
                label: "修订 / 发布",
                value: instance.container
                  ? [
                      instance.container.revision,
                      instance.container.rollout_status
                        ? (rolloutLabels[instance.container.rollout_status] ??
                          instance.container.rollout_status)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "-"
                  : "-",
              },
              {
                label: "Workload Identity",
                value: workloadIdentityLabel,
              },
              {
                label: "负载均衡",
                value: loadBalancerRefs.length ? loadBalancerRefs.join("、") : "-",
              },
              {
                label: "调用地址",
                value: instance.endpoint ? (
                  <a
                    href={instance.endpoint}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-[rgb(var(--link-6))]"
                  >
                    {instance.endpoint}
                  </a>
                ) : (
                  "-"
                ),
              },
              {
                label: "安全组",
                value: securityGroups.length
                  ? securityGroups.map((group) => group.name ?? group.id).join("、")
                  : "-",
              },
              { label: "创建时间", value: formatDateTime(instance.created_at) },
              {
                label: "关联对象",
                value: (
                  <span>
                    <strong>{relatedItems.length}</strong> 个
                  </span>
                ),
              },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: relatedItems.length
              ? relatedItems.map((item) => {
                  const summary = `${item.name}${
                    item.id && item.id !== item.name ? ` · ${item.id}` : ""
                  }`;
                  return {
                    label: item.kind,
                    value: (
                      <Tooltip content={summary}>
                        <span className="block min-w-0 truncate">{summary}</span>
                      </Tooltip>
                    ),
                  };
                })
              : [{ label: "暂无关联对象", value: "-" }],
          },
        ]}
        tabs={[
          {
            key: "release",
            label: "版本",
            content: (
              <InstanceVersions
                instance={instance}
                onChanged={refreshInstance}
                updateImage={actions.find((action) => action.key === "update_image")}
                rollbackDisabled={!rollbackAction || Boolean(rollbackAction.disabled?.(instance))}
              />
            ),
          },
          {
            key: "configuration",
            label: "配置",
            content: (
              <InstanceConfiguration instance={instance} onChanged={() => detail.refetch()} />
            ),
          },
          {
            key: "storage",
            label: "数据卷",
            content: (
              <InstanceStorage
                instance={instance}
                mountVolume={actions.find((action) => action.key === "attach_volume")}
                mountFilesystem={actions.find((action) => action.key === "attach_filesystem")}
              />
            ),
          },
          {
            key: "network",
            label: "网络",
            content: <InstanceNetwork instance={instance} />,
          },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={instance.id} instanceKind="gpu_container" />,
          },
          {
            key: "gpu-metrics",
            label: "GPU 指标",
            content: (
              <InstanceMetrics
                instanceId={instance.id}
                instanceKind="gpu_container"
                gpuOnly
                gpuModel={instance.gpu?.model ?? instance.compute?.gpu_type}
                gpuCount={instance.gpu?.count}
              />
            ),
          },
          {
            key: "logs",
            label: "日志",
            content: <InstanceLogs instanceId={instance.id} active />,
          },
          {
            key: "events",
            label: "事件",
            content: <InstanceEvents instanceId={instance.id} />,
          },
          {
            key: "operations",
            label: "操作记录",
            content: <InstanceOperations instanceId={instance.id} />,
          },
        ]}
        defaultTabKey="release"
        activeTabKey={tab}
        onTabChange={(key) => onTabChange(key as GpuInstanceDetailTabKey)}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}

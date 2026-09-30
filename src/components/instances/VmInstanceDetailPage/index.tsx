import { withId } from "@/lib/id";
import { getInstance, type InstanceRecord } from "@/api/instances";
import { Button, Empty, Space, Tooltip } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ImageNameText,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { InstanceEvents } from "@/components/instances/InstanceEvents";
import { InstanceLogs } from "@/components/instances/InstanceLogs";
import { InstanceMetrics } from "@/components/instances/InstanceMetrics";
import { InstanceOperations } from "@/components/instances/InstanceOperations";
import { InstanceStorage } from "@/components/instances/InstanceStorage";
import { useVmInstanceActions } from "@/hooks/useVmInstanceActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { getImageDisplayName } from "@/lib/render";
import { openVmInstanceRemoteWindow, type ComputeInstanceDetailTabKey } from "@/lib/instances";
import { VmInstanceSnapshots } from "./VmInstanceSnapshots";
import { VmInstanceSshAccess } from "./VmInstanceSshAccess";

type VmInstance = InstanceRecord;

function imageLabel(instance: VmInstance) {
  return getImageDisplayName(instance.image);
}

function specLabel(instance: VmInstance) {
  const cpu = instance.compute?.cpu;
  const memory = instance.compute?.memory;
  if (cpu == null && memory == null) return "-";
  const cpuText = cpu == null ? "-" : String(cpu).replace(/C$/i, "");
  return `${cpuText} / ${memory ?? "-"}`;
}

function flavorLabel(instance: VmInstance) {
  if (instance.compute?.spec_id) return instance.compute.spec_id;
  const cpu = instance.compute?.cpu;
  const memory = instance.compute?.memory;
  if (cpu == null || memory == null) return "-";
  const cpuText = String(cpu).replace(/C$/i, "");
  const memoryText = String(memory).replace(/Gi$/i, "G");
  return `${cpuText}C${memoryText}`;
}

export function VmInstanceDetailPage({
  instanceId,
  tab,
  onTabChange,
}: {
  instanceId: string;
  tab: ComputeInstanceDetailTabKey;
  onTabChange: (tab: ComputeInstanceDetailTabKey) => void;
}) {
  const goBack = useBackOrFallback("vm-instance");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("vm", instanceId),
        action: "云主机详情加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["vm-instance", instanceId],
    queryFn: () => getInstance(instanceId),
  });
  const refreshDetail = () => void detail.refetch();
  const { actions, dialogNode } = useVmInstanceActions(refreshDetail, goBack);
  const primaryAction = actions.find((action) => action.key === "console");
  if (!detail.data) {
    return <DetailPagePlaceholder loading={detail.isLoading} />;
  }

  const instance = detail.data;
  if (instance.kind !== "vm") {
    return <Empty description="当前资源不是云主机 VM" />;
  }

  const autoStart = (instance as VmInstance & { auto_start?: boolean | null }).auto_start;
  const securityGroups = instance.network?.security_groups ?? [];
  const loadBalancerRefs = instance.network?.load_balancer_refs ?? [];
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
      kind: volume.kind === "root_disk" ? "系统盘" : "云盘",
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
        breadcrumbs={[...navigationBreadcrumbsForPath("/vm-instances"), { label: instance.name }]}
        title={instance.name}
        status={<StatusBadge status={instance.state} reason={instance.reason} />}
        icon={<AliIcon name="yunzhuji" size={28} />}
        headerItems={[{ label: "CPU / 内存", value: specLabel(instance) }]}
        actions={
          <Space>
            <Button
              type="primary"
              disabled={!primaryAction || primaryAction.disabled?.(instance)}
              loading={primaryAction?.loading?.(instance)}
              onClick={() => primaryAction?.onClick(instance)}
            >
              打开控制台
            </Button>
            <ResourceActionMenu
              record={instance}
              actions={actions.filter((action) => action.key !== "console")}
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
              { label: "规格", value: flavorLabel(instance) },
              {
                label: "镜像",
                value: <ImageNameText image={instance.image} />,
              },
              {
                label: "节点",
                value: instance.compute?.node_name ?? instance.node_name ?? "-",
              },
              { label: "CPU / 内存", value: specLabel(instance) },
              {
                label: "私网 IP",
                value: instance.network?.private_ip ?? instance.private_ip ?? "-",
              },
              {
                label: "自动启动",
                value: typeof autoStart === "boolean" ? (autoStart ? "是" : "否") : "-",
              },
              {
                label: "安全组",
                value: securityGroups.length
                  ? securityGroups.map((group) => group.name ?? group.id).join(" · ")
                  : "-",
              },
              { label: "创建时间", value: formatDateTime(instance.created_at) },
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
            key: "ssh",
            label: "远程连接",
            content: (
              <VmInstanceSshAccess
                instance={instance}
                onOpenConsole={() => openVmInstanceRemoteWindow(instance.id)}
              />
            ),
          },
          {
            key: "storage",
            label: "存储挂载",
            content: (
              <InstanceStorage
                instance={instance}
                mountVolume={actions.find((action) => action.key === "attach-volume")}
                mountFilesystem={actions.find((action) => action.key === "attach-filesystem")}
              />
            ),
          },
          {
            key: "snapshots",
            label: "快照",
            content: (
              <VmInstanceSnapshots
                instance={instance}
                onChanged={refreshDetail}
                createAction={actions.find((action) => action.key === "snapshot")}
              />
            ),
          },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={instance.id} instanceKind="vm" />,
          },
          {
            key: "logs",
            label: "日志",
            content: <InstanceLogs instanceId={instance.id} active={tab === "logs"} />,
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
        defaultTabKey="ssh"
        activeTabKey={tab}
        onTabChange={(key) => onTabChange(key as ComputeInstanceDetailTabKey)}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}

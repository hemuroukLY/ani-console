import { Button, Space } from "@arco-design/web-react";
import { withId } from "@/lib/id";
import type { InstanceRecord } from "@/api/instances";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { InstanceLogs } from "@/components/instances/InstanceLogs";
import { InstanceEvents } from "@/components/instances/InstanceEvents";
import { InstanceMetrics } from "@/components/instances/InstanceMetrics";
import { InstanceOperations } from "@/components/instances/InstanceOperations";
import { InstanceConfiguration } from "@/components/instances/InstanceConfiguration";
import { InstanceNetwork } from "@/components/instances/InstanceNetwork";
import { InstanceStorage } from "@/components/instances/InstanceStorage";
import { InstanceVersions } from "@/components/instances/InstanceVersions";
import { useContainerInstanceActions } from "@/hooks/useContainerInstanceActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { getImageDisplayName } from "@/lib/render";
import { getInstanceDisplayIp, getInstanceNetworkValue } from "@/lib/instances";
import { containerDetailDataSource } from "./data-source";

export function ContainerInstanceDetailPage({
  instanceId,
  tab,
  onTabChange,
}: {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("container-instance");
  const qc = useQueryClient();

  const query = useQuery({
    meta: {
      errorNotification: {
        id: withId("container", instanceId),
        action: "容器实例详情加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["container-instance-detail", instanceId],
    queryFn: () => containerDetailDataSource.getDetail(instanceId),
  });
  const refreshInstance = () => {
    void query.refetch();
    void qc.invalidateQueries({ queryKey: ["container-instances"] });
  };
  const { actions, dialogNode } = useContainerInstanceActions(refreshInstance, goBack);
  const primaryAction = actions.find((action) => action.key === "terminal");
  if (!query.data) return <DetailPagePlaceholder loading={query.isLoading} />;

  const detail = query.data;
  const rollbackAction = actions.find((action) => action.key === "rollback");

  const nameValue =
    detail.compute?.cpu || detail.compute?.memory
      ? [detail.compute?.cpu, detail.compute?.memory].filter(Boolean).join(" / ")
      : "-";

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[
          ...navigationBreadcrumbsForPath("/container-instances"),
          { label: detail.name },
        ]}
        icon={<AliIcon name="icon-rongqishili" size={28} />}
        title={detail.name}
        status={<StatusBadge status={detail.state} reason={detail.reason} />}
        headerItems={[
          { label: "镜像", value: getImageDisplayName(detail.image) },
          { label: "规格", value: nameValue },
          { label: "私网 IP", value: getInstanceDisplayIp(detail) || "-" },
        ]}
        actions={
          <Space>
            <Button
              type="primary"
              disabled={!primaryAction || primaryAction.disabled?.(detail)}
              loading={primaryAction?.loading?.(detail)}
              onClick={() => primaryAction?.onClick(detail)}
            >
              远程终端
            </Button>
            <ResourceActionMenu
              record={detail}
              actions={actions.filter((action) => action.key !== "terminal")}
            />
          </Space>
        }
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={detail.id} /> },
              { label: "节点", value: detail.node_name ?? "-" },
              { label: "创建时间", value: formatDateTime(detail.created_at) },
              { label: "更新时间", value: formatDateTime(detail.updated_at) },
              {
                label: "终止保护",
                value: detail.termination_protection ? "已开启" : "未开启",
              },
            ],
          },
          {
            key: "resource",
            title: "资源状态",
            defaultCollapsed: true,
            fields: [
              {
                label: "副本",
                value:
                  detail.container?.replicas != null
                    ? `${detail.container.ready_replicas ?? 0}/${detail.container.replicas}`
                    : "-",
              },
              {
                label: "发布状态",
                value: detail.container?.rollout_status ?? "-",
              },
              { label: "访问地址", value: detail.endpoint ?? "-" },
              { label: "VPC", value: getInstanceNetworkValue(detail, "vpc_id") },
              {
                label: "子网",
                value: getInstanceNetworkValue(detail, "subnet_id"),
              },
            ],
          },
        ]}
        tabs={[
          {
            key: "release",
            label: "版本",
            content: (
              <InstanceVersions
                instance={detail as InstanceRecord}
                onChanged={() => void query.refetch()}
                updateImage={actions.find((action) => action.key === "update_image")}
                rollbackDisabled={!rollbackAction || Boolean(rollbackAction.disabled?.(detail))}
              />
            ),
          },
          {
            key: "configuration",
            label: "配置",
            content: (
              <InstanceConfiguration
                instance={detail as InstanceRecord}
                onChanged={() => void query.refetch()}
              />
            ),
          },
          {
            key: "storage",
            label: "数据卷",
            content: (
              <InstanceStorage
                instance={detail as InstanceRecord}
                mountVolume={actions.find((action) => action.key === "attach_volume")}
                mountFilesystem={actions.find((action) => action.key === "attach_filesystem")}
              />
            ),
          },
          {
            key: "network",
            label: "网络",
            content: <InstanceNetwork instance={detail as InstanceRecord} />,
          },
          {
            key: "monitoring",
            label: "资源监控",
            content: <InstanceMetrics instanceId={instanceId} instanceKind="container" />,
          },
          {
            key: "logs",
            label: "日志",
            content: <InstanceLogs instanceId={instanceId} active={true} />,
          },
          {
            key: "events",
            label: "事件",
            content: <InstanceEvents instanceId={instanceId} />,
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
      {dialogNode}
    </>
  );
}

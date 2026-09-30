import { useFilesystemActions } from "@/hooks/useFilesystemActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";

import { getFilesystem, type StorageFilesystem } from "@/api/storage/filesystems";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { withId } from "@/lib/id";

import { useQuery } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useCallback, useState } from "react";

import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { FilesystemMountTargets } from "./FilesystemMountTargets";

type Filesystem = StorageFilesystem;

export function FilesystemDetailPage({ filesystemId }: { filesystemId: string }) {
  const goBack = useBackOrFallback("filesystem");

  const [mountCount, setMountCount] = useState(0);
  const handleMountCountChange = useCallback((count: number) => setMountCount(count), []);
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("filesystem", filesystemId),
        action: "文件存储加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["filesystem", filesystemId],
    queryFn: () => getFilesystem(filesystemId),
  });
  const { actions, dialogNode, openMountTarget } = useFilesystemActions(goBack);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const filesystem = detail.data as Filesystem;
  // const unavailable = (description: string) => <Empty description={description} />;
  const filesystemStatus = <StatusBadge status={filesystem.state} reason={filesystem.reason} />;

  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/filesystems"), { label: filesystem.name }]}
        title={filesystem.name}
        status={filesystemStatus}
        icon={<AliIcon name="wenjiancunchu" size={28} />}
        headerItems={[{ label: "容量 (GiB)", value: String(filesystem.size_gib) }]}
        actions={<ResourceActionMenu record={filesystem} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={filesystem.id} /> },
              { label: "协议", value: filesystem.protocol.toUpperCase() },
              {
                label: "性能模式",
                value:
                  filesystem.performance_mode === "standard"
                    ? "标准型"
                    : filesystem.performance_mode === "throughput"
                      ? "吞吐型"
                      : "-",
              },
              { label: "容量 (GiB)", value: filesystem.size_gib },
              {
                label: "创建时间",
                value: formatDateTime(filesystem.created_at),
              },
              {
                label: "更新时间",
                value: formatDateTime(filesystem.updated_at),
              },
            ],
          },
          {
            key: "related-summary",
            title: "关联摘要",
            fields: [{ label: "挂载点", value: `${mountCount} 个` }],
          },
        ]}
        tabs={[
          {
            key: "mount-targets",
            label: "挂载点",
            content: (
              <FilesystemMountTargets
                onCreateMountTarget={() => openMountTarget(filesystemId)}
                filesystemId={filesystemId}
                onMountCountChange={handleMountCountChange}
              />
            ),
          },
          // {
          //   key: "events",
          //   label: "事件",
          //   content: (
          //     <Space direction="vertical" size={12} className="w-full">
          //       {unavailable("当前 Core API 暂未提供文件存储事件列表")}
          //     </Space>
          //   ),
          // },
        ]}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}

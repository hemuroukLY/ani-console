import { copyToClipboard } from "@/lib/clipboard";
import {
  getFilesystemMountCommand,
  listFilesystemMountTargets,
  type FilesystemMountTarget,
} from "@/api/storage/filesystems";
import { DataTable, StatusBadge, type RowAction } from "@/components/common";

import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { Button, Empty } from "@arco-design/web-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function FilesystemMountTargets({
  filesystemId,
  onMountCountChange,
  onCreateMountTarget,
}: {
  filesystemId: string;
  onCreateMountTarget: () => void;
  onMountCountChange: (count: number) => void;
}) {
  const mounts = useQuery({
    meta: {
      errorNotification: {
        id: withId("filesystem-mounts", filesystemId),
        action: "挂载点加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["filesystem-mounts", filesystemId],
    queryFn: () => listFilesystemMountTargets(filesystemId, { limit: 100 }),
  });
  const items = (mounts.data?.items ?? []) as FilesystemMountTarget[];
  const copyCommand = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "filesystem-mount-command",
        action: "获取挂载命令",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async (target: FilesystemMountTarget) => {
      const data = await getFilesystemMountCommand(filesystemId);
      if (!data.command) throw new Error("未返回挂载命令");
      const command =
        data.ip_address && data.ip_address !== target.ip_address
          ? data.command.replace(data.ip_address, target.ip_address)
          : data.command;
      await copyToClipboard(command, "挂载命令");
    },
  });
  const actions: RowAction<FilesystemMountTarget>[] = [
    {
      key: "copy-mount-command",
      label: "复制挂载命令",
      disabled: (target) => target.status !== "available" || copyCommand.isPending,
      loading: (target) => copyCommand.isPending && copyCommand.variables?.id === target.id,
      onClick: (target) => copyCommand.mutateAsync(target),
    },
  ];

  useEffect(() => {
    onMountCountChange(items.length);
  }, [items.length, onMountCountChange]);

  return (
    <>
      <div>
        <DataTable<FilesystemMountTarget>
          header={{
            title: "挂载点",
            extra: (
              <Button type="primary" onClick={onCreateMountTarget}>
                创建挂载点
              </Button>
            ),
          }}
          columns={[
            { title: "挂载地址", dataIndex: "ip_address", width: 100, fixed: "left" },
            {
              title: "状态",
              width: 120,
              render: (_, row) => <StatusBadge status={row.status} />,
            },
            {
              title: "VPC",
              width: 200,
              ellipsis: true,
              dataIndex: "vpc_id",
              placeholder: "-",
            },
            {
              title: "子网",
              width: 200,
              ellipsis: true,
              dataIndex: "subnet_id",
              placeholder: "-",
            },
            {
              title: "创建时间",
              width: 200,
              render: (_, row) => formatDateTime(row.created_at),
            },
          ]}
          data={items}
          loading={mounts.isLoading}
          pagination={false}
          rowActions={actions}
          noDataElement={<Empty description="暂无挂载目标，请创建挂载目标后获取访问地址" />}
        />
      </div>
    </>
  );
}

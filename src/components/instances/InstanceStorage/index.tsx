import type { InstanceRecord } from "@/api/instances";

import { DataTable, StatusBadge, type RowAction } from "@/components/common";

import { Button, Empty, Space } from "@arco-design/web-react";

type Instance = InstanceRecord;
type Volume = NonNullable<Instance["volumes"]>[number];
type FilesystemAttachment = NonNullable<Instance["storage_attachments"]>[number];
export function InstanceStorage({
  instance,
  mountVolume,
  mountFilesystem,
}: {
  instance: Instance;
  mountVolume?: RowAction<Instance>;
  mountFilesystem?: RowAction<Instance>;
}) {
  const volumes = instance.volumes ?? [];
  const filesystems = (instance.storage_attachments ?? []).filter(
    (attachment) => attachment.resource_type === "filesystem",
  );
  return (
    <>
      <Space direction="vertical" size={24} className="w-full">
        <section>
          <DataTable<Volume>
            header={{
              title: "挂载点",
              extra: (
                <Button
                  disabled={!mountVolume || mountVolume.disabled?.(instance)}
                  onClick={() => mountVolume?.onClick(instance)}
                >
                  挂载云盘
                </Button>
              ),
            }}
            data={volumes}
            rowKey={(volume) =>
              `${volume.kind}:${volume.source_ref ?? volume.name}:${volume.mount_path ?? ""}`
            }
            pagination={false}
            noDataElement={<Empty description="暂无挂载点" />}
            columns={[
              { title: "名称", dataIndex: "name" },
              { title: "类型", dataIndex: "kind", width: 150 },
              {
                title: "挂载路径",
                dataIndex: "mount_path",
                placeholder: "-",
              },
              {
                title: "访问模式",
                width: 100,
                render: (_, volume) => (volume.read_only ? "只读" : "读写"),
              },
            ]}
          />
        </section>

        <section>
          <DataTable<FilesystemAttachment>
            header={{
              title: "文件存储 NFS",
              extra: (
                <Button
                  disabled={!mountFilesystem || mountFilesystem.disabled?.(instance)}
                  onClick={() => mountFilesystem?.onClick(instance)}
                >
                  挂载 NFS
                </Button>
              ),
            }}
            data={filesystems}
            rowKey={(filesystem) => `${filesystem.resource_id}:${filesystem.mount_path ?? ""}`}
            pagination={false}
            noDataElement={<Empty description="暂无文件存储 NFS" />}
            columns={[
              {
                title: "文件存储",
                render: (_, filesystem) => filesystem.resource_name ?? filesystem.resource_id,
              },
              { title: "文件系统 ID", dataIndex: "resource_id" },
              {
                title: "挂载路径",
                dataIndex: "mount_path",
                placeholder: "-",
              },
              {
                title: "访问模式",
                width: 100,
                render: (_, filesystem) => (filesystem.read_only ? "只读" : "读写"),
              },
              {
                title: "状态",
                width: 120,
                render: (_, filesystem) =>
                  filesystem.status ? <StatusBadge status={filesystem.status} /> : "-",
              },
            ]}
          />
        </section>
      </Space>
    </>
  );
}

import {
  listSandboxCheckpoints,
  type SandboxCheckpoint,
  restoreSandboxCheckpoint,
} from "@/api/instances";
import { DataTable, StatusBadge, type RowAction } from "@/components/common";
import { formatBytes, formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { Button, Empty, Space, Typography, Modal } from "@arco-design/web-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { SandboxCheckpointCloneModal } from "@/components/instances/SandboxCheckpointCloneModal";
import { SandboxCheckpointCreateModal } from "@/components/instances/SandboxCheckpointCreateModal";

export function SandboxCheckpoints({
  instanceId,
  sessionState,
  onChanged,
}: {
  instanceId: string;
  sessionState: string;
  onChanged: () => void;
}) {
  const checkpoints = useQuery({
    meta: {
      errorNotification: {
        id: withId("sandbox-checkpoints", instanceId),
        action: "检查点加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["sandbox-checkpoints", instanceId],
    queryFn: () => listSandboxCheckpoints(instanceId),
  });

  const [createVisible, setCreateVisible] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<SandboxCheckpoint>();
  const canCheckpoint = ["running", "paused"].includes(sessionState);
  const restoreCheckpoint = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "sandbox-checkpoint-restore",
        action: "检查点恢复",
        successText: "检查点已恢复",
        errorFallback: "检查点恢复失败",
      },
    },
    mutationFn: async (checkpoint: SandboxCheckpoint) => {
      await restoreSandboxCheckpoint(instanceId, checkpoint.id);
      return checkpoint;
    },
    onSuccess: () => {
      void checkpoints.refetch();
      onChanged();
    },
  });

  const confirmRestore = (checkpoint: SandboxCheckpoint) => {
    Modal.confirm({
      title: `恢复检查点 ${checkpoint.name}`,
      content: "当前工作区内容将回滚到该检查点，此操作会覆盖此后产生的文件变更。",
      okButtonProps: { status: "danger" },
      onOk: () => restoreCheckpoint.mutateAsync(checkpoint),
    });
  };

  const actions: RowAction<SandboxCheckpoint>[] = [
    {
      key: "restore",
      label: "恢复",
      disabled: (item) => item.status !== "available" || !canCheckpoint,
      onClick: confirmRestore,
    },
    {
      key: "clone",
      label: "克隆",
      disabled: (item) => item.status !== "available",
      onClick: setCloneTarget,
    },
  ];
  const dialogNode = (
    <>
      {createVisible && (
        <SandboxCheckpointCreateModal
          instanceId={instanceId}
          onCancel={() => setCreateVisible(false)}
          onCreated={() => {
            void checkpoints.refetch();
            onChanged();
          }}
        />
      )}
      {cloneTarget && (
        <SandboxCheckpointCloneModal
          instanceId={instanceId}
          checkpoint={cloneTarget}
          onCancel={() => setCloneTarget(undefined)}
        />
      )}
    </>
  );
  const openCreate = () => setCreateVisible(true);

  return (
    <>
      <Space direction="vertical" size={24} className="w-full">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography.Title heading={6}>检查点</Typography.Title>
            <Space>
              <Button
                size="small"
                loading={checkpoints.isFetching}
                onClick={() => checkpoints.refetch()}
              >
                刷新
              </Button>
              <Button size="small" type="primary" disabled={!canCheckpoint} onClick={openCreate}>
                创建检查点
              </Button>
            </Space>
          </div>

          <DataTable<SandboxCheckpoint>
            data={checkpoints.data?.items ?? []}
            rowKey="id"
            loading={checkpoints.isLoading || checkpoints.isFetching}
            pagination={false}
            noDataElement={<Empty description="暂无检查点" />}
            rowActions={actions}
            columns={[
              {
                title: "名称",
                ellipsis: true,
                dataIndex: "name",
              },
              {
                title: "状态",
                width: 120,
                render: (_, item) => <StatusBadge status={item.status} reason={item.reason} />,
              },
              {
                title: "内容",
                width: 120,
                render: (_, item) => (item.keep_memory ? "文件系统 + 内存" : "仅文件系统"),
              },
              {
                title: "大小",
                width: 110,
                render: (_, item) => formatBytes(item.size_bytes ?? undefined),
              },
              {
                title: "创建时间",
                width: 180,
                render: (_, item) => formatDateTime(item.created_at),
              },
            ]}
          />
        </section>
      </Space>

      {dialogNode}
    </>
  );
}

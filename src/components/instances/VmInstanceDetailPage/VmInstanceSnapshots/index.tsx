import { type InstanceRecord } from "@/api/instances";
import { Button, Empty, Tooltip } from "@arco-design/web-react";
import { DataTable, ResourceNameId, StatusBadge, type RowAction } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { VmInstanceRollbackModal } from "@/components/instances/VmInstanceRollbackModal";
import { useState } from "react";

type VmInstance = InstanceRecord;
type Snapshot = NonNullable<VmInstance["snapshots"]>[number];

export function VmInstanceSnapshots({
  instance,
  onChanged,
  createAction,
}: {
  instance: VmInstance;
  onChanged: () => void;
  createAction?: RowAction<VmInstance>;
}) {
  const [rollbackSnapshot, setRollbackSnapshot] = useState<Snapshot>();
  const actions: RowAction<Snapshot>[] = [
    {
      key: "rollback",
      label: "回滚",
      disabled: (snapshot) =>
        !createAction || Boolean(createAction.disabled?.(instance)) || snapshot.state !== "ready",
      onClick: setRollbackSnapshot,
    },
  ];
  const dialogNode = (
    <>
      {rollbackSnapshot && (
        <VmInstanceRollbackModal
          instance={instance}
          snapshot={rollbackSnapshot}
          onCancel={() => setRollbackSnapshot(undefined)}
          onSubmitted={() => {
            setRollbackSnapshot(undefined);
            onChanged();
          }}
        />
      )}
    </>
  );

  return (
    <>
      <section>
        <DataTable<Snapshot>
          header={{
            title: "快照",
            extra: (
              <Button
                disabled={!createAction || createAction.disabled?.(instance)}
                onClick={() => createAction?.onClick(instance)}
              >
                创建快照
              </Button>
            ),
          }}
          data={instance.snapshots ?? []}
          rowKey="id"
          pagination={false}
          noDataElement={<Empty description="暂无快照" />}
          rowActions={actions}
          columns={[
            {
              key: "name",
              title: "名称 / ID",
              fixed: "left",
              width: 200,
              render: (_, row) => <ResourceNameId name={row.name} id={row.id} openable={false} />,
            },
            {
              title: "状态",
              width: 120,
              render: (_, snapshot) => {
                const statusTag = <StatusBadge status={snapshot.state} />;
                return snapshot.reason ? (
                  <Tooltip content={snapshot.reason}>
                    <span className="inline-flex">{statusTag}</span>
                  </Tooltip>
                ) : (
                  statusTag
                );
              },
            },
            {
              title: "创建时间",
              width: 180,
              render: (_, snapshot) => formatDateTime(snapshot.created_at),
            },
          ]}
        />
      </section>

      {dialogNode}
    </>
  );
}

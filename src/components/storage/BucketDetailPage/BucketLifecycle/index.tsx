import {
  listBucketLifecycleRules,
  type StorageBucketLifecycleRule,
  deleteBucketLifecycleRule,
} from "@/api/storage/buckets";
import { DataTable, StatusBadge, type RowAction } from "@/components/common";
import { withId } from "@/lib/id";
import { Button, Empty, Space, Typography, Modal } from "@arco-design/web-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateLifecycleRuleModal } from "@/components/storage/CreateLifecycleRuleModal";
import { useState } from "react";

export function BucketLifecycle({ bucketId }: { bucketId: string }) {
  const rules = useQuery({
    meta: {
      errorNotification: {
        id: withId("bucket-lifecycle", bucketId),
        action: "生命周期规则加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["bucket-lifecycle-rules", bucketId],
    queryFn: () => listBucketLifecycleRules(bucketId),
  });

  const qc = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<StorageBucketLifecycleRule>();
  const remove = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "lifecycle-rule-delete",
        action: "删除",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (rule: StorageBucketLifecycleRule) => deleteBucketLifecycleRule(bucketId, rule.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bucket-lifecycle-rules", bucketId] });
      void qc.invalidateQueries({ queryKey: ["bucket", bucketId] });
      void qc.invalidateQueries({ queryKey: ["buckets"] });
    },
  });
  const actions: RowAction<StorageBucketLifecycleRule>[] = [
    {
      key: "edit",
      label: "编辑",
      onClick: (row) => {
        setEditingRule(row);
        setVisible(true);
      },
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      loading: (row) => remove.isPending && remove.variables?.id === row.id,
      onClick: (row) =>
        void Modal.confirm({
          title: "删除生命周期规则",
          content: `确定删除规则「${row.name}」？`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(row),
        }),
    },
  ];
  const dialogNode = (
    <>
      {visible && (
        <CreateLifecycleRuleModal
          bucketId={bucketId}
          rule={editingRule}
          onCancel={() => setVisible(false)}
        />
      )}
    </>
  );
  const openCreate = () => {
    setEditingRule(undefined);
    setVisible(true);
  };
  const items = (rules.data?.items ?? []) as StorageBucketLifecycleRule[];

  return (
    <>
      <Space direction="vertical" size={12} className="w-full">
        <div className="flex w-full items-center justify-between">
          <Typography.Text>
            共 <Typography.Text bold>{items.length}</Typography.Text> 条生命周期规则
          </Typography.Text>
          <Button type="primary" onClick={openCreate}>
            添加规则
          </Button>
        </div>
        <DataTable<StorageBucketLifecycleRule>
          columns={[
            { title: "名称", dataIndex: "name" },
            { title: "前缀", dataIndex: "prefix", placeholder: "全部" },
            { title: "转低频天数", dataIndex: "to_infrequent_days" },
            { title: "过期天数", dataIndex: "expire_days" },
            {
              title: "状态",
              width: 120,
              render: (_, row) => (
                <StatusBadge tone={row.enabled ? "success" : "neutral"}>
                  {row.enabled ? "启用" : "停用"}
                </StatusBadge>
              ),
            },
          ]}
          data={items}
          loading={rules.isLoading}
          pagination={false}
          rowActions={actions}
          noDataElement={<Empty description="暂无生命周期规则，点击「添加规则」开始" />}
        />
      </Space>
      {dialogNode}
    </>
  );
}

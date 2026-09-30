import { listInstances, type InstanceRecord, type FilterableInstanceState } from "@/api/instances";
import { useEffect, useState } from "react";
import {
  ResourceNameId,
  ListPageFrame,
  StatusBadge,
  type ListColumn,
  ListDataTable,
} from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { formatDateTime } from "@/lib/format";
import { getImageDisplayName } from "@/lib/render";
import { SandboxInstanceCreateModal } from "@/components/instances/SandboxInstanceCreateModal";
import { useSandboxInstanceActions } from "@/hooks/useSandboxInstanceActions";

type SandboxInstance = InstanceRecord;
type SandboxStatus = "all" | FilterableInstanceState;
type SearchField = "name" | "id";

export function SandboxInstancesPage() {
  const [status, setStatus] = useState<SandboxStatus>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const [createVisible, setCreateVisible] = useState(false);

  const { query, page, pageSize, setPage, setPageSize, refresh } =
    useCursorPaginatedQuery<SandboxInstance>({
      errorNotification: {
        id: "sandboxes",
        action: "沙箱实例列表加载",
        fallback: "请求失败，请稍后重试",
      },
      queryKey: ["sandbox-instances", { status, searchField, searchText }],
      cursorScope: `sandbox:${status}:${searchField}:${searchText.trim()}`,
      fetchPage: async ({ cursor, limit }) => {
        const keyword = searchText.trim();
        return listInstances({
          kind: "sandbox",
          state: status === "all" ? undefined : status,
          search_field: keyword ? searchField : undefined,
          keyword: keyword || undefined,
          cursor,
          limit,
        });
      },
    });
  const { dialogNode, actions } = useSandboxInstanceActions(refresh);

  useEffect(() => setPage(1), [searchField, searchText, setPage, status]);

  const rows = (query.data?.items ?? []) as SandboxInstance[];
  const statusTabs = [
    { value: "all" as const, label: "全部" },
    { value: "pending" as const, label: "等待中" },
    { value: "provisioning" as const, label: "配置中" },
    { value: "starting" as const, label: "启动中" },
    { value: "running" as const, label: "运行中" },
    { value: "stopping" as const, label: "停止中" },
    { value: "stopped" as const, label: "已停止" },
    { value: "failed" as const, label: "异常" },
  ];

  const columns: Array<ListColumn<SandboxInstance>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => (
        <ResourceNameId name={item.name || item.id} id={item.id} type="sandbox-instance" />
      ),
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => (
        <StatusBadge status={item.state} reason={item.reason ?? item.sandbox?.stop_reason} />
      ),
    },
    {
      key: "template",
      title: "模板 / 镜像",
      width: 150,
      ellipsis: true,
      render: (_, item) => getImageDisplayName(item.image),
    },
    {
      key: "ttl",
      title: "会话时长",
      width: 110,
      dataIndex: "sandbox.session_timeout",
      placeholder: "-",
    },
    { key: "idle", title: "空闲剩余", width: 110, render: () => "-" },
    {
      key: "session",
      title: "关联会话",
      width: 110,
      render: (_, item) => (item.access?.exec_available ? "可连接" : "-"),
    },
    {
      key: "egress",
      title: "出口策略",
      width: 130,
      dataIndex: "sandbox.network_egress_policy",
      placeholder: "-",
    },
    {
      key: "protection",
      title: "终止保护",
      width: 100,
      render: (_, item) => (item.termination_protection ? "已开启" : "未开启"),
    },
    {
      key: "created",
      title: "创建时间",
      width: 150,
      render: (_, item) => formatDateTime(item.created_at),
    },
  ];

  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-Sandbox",
          title: "沙箱实例",
          subtitle: "隔离会话、双超时与受控网络出口",
          actions: [
            {
              key: "header-action-1",
              label: "创建沙箱",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{
          items: statusTabs,
          value: status,
          onChange: setStatus,
        }}
        toolbar={{
          search: {
            fields: [
              {
                value: "name",
                label: "名称",
              },
              {
                value: "id",
                label: "ID",
              },
            ],
            field: searchField,
            value: searchText,
            onFieldChange: setSearchField,
            onChange: setSearchText,
          },
          refresh: {
            label: "刷新",
            spinning: query.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={rows}
          columns={columns}
          rowActions={actions}
          loading={query.isFetching}
          emptyIconClassName="icon-Sandbox"
          emptyText="还没有沙箱实例，点击右上角创建"
          tableLabel="沙箱实例列表"
          preserveTableOnEmpty
          pagination={{
            page,
            pageSize,
            total: query.data?.total ?? rows.length,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </ListPageFrame>
      <SandboxInstanceCreateModal
        visible={createVisible}
        onCancel={() => setCreateVisible(false)}
        onCreated={() => setCreateVisible(false)}
      />
      {dialogNode}
    </>
  );
}

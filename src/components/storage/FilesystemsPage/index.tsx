import { useFilesystemActions } from "@/hooks/useFilesystemActions";

import { useQueries, useQueryClient } from "@tanstack/react-query";

import { useMemo, useState } from "react";
import {
  listFilesystemMountTargets,
  listFilesystems,
  type StorageFilesystem,
} from "@/api/storage/filesystems";

import { CreateFilesystemModal } from "@/components/storage/CreateFilesystemModal";

import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
} from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { formatDateTime } from "@/lib/format";

type Filesystem = StorageFilesystem;
type StatusFilter = "all" | "available" | "pending" | "failed";
type SearchField = "name" | "id";

export function FilesystemsPage() {
  const qc = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const {
    query: filesystems,
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
    refresh,
  } = useCursorPaginatedQuery<Filesystem>({
    errorNotification: {
      id: "filesystems",
      action: "文件存储列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["filesystems", { status, searchField, searchText }],
    cursorScope: `${status}:${searchField}:${searchText.trim()}`,
    fetchPage: async ({ cursor, limit }) => {
      const keyword = searchText.trim();
      return listFilesystems({
        limit,
        cursor,
        state: status === "all" ? undefined : status,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const { actions, dialogNode } = useFilesystemActions(() => {
    resetPagination();
    void qc.invalidateQueries({ queryKey: ["filesystems"] });
  });
  const items = useMemo(
    () => (filesystems.data?.items ?? []) as Filesystem[],
    [filesystems.data?.items],
  );
  const paginationTotal = filesystems.data?.total ?? items.length;
  const mountTargetQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["filesystem-mounts", item.id, "count"],
      queryFn: () => listFilesystemMountTargets(item.id, { limit: 1 }),
    })),
  });
  const mountTargetCounts = new Map(
    items.map((item, index) => [item.id, mountTargetQueries[index]?.data?.total]),
  );
  const columns: Array<ListColumn<Filesystem>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="filesystem" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} />,
    },
    {
      key: "size",
      title: "容量",
      width: 100,
      ellipsis: true,
      render: (_, item) => `${item.size_gib} GiB`,
    },
    {
      key: "protocol",
      title: "协议",
      width: 100,
      render: (_, item) => item.protocol.toUpperCase(),
    },
    {
      key: "performanceMode",
      title: "性能模式",
      width: 100,
      render: (_, item) =>
        item.performance_mode === "standard"
          ? "标准型"
          : item.performance_mode === "throughput"
            ? "吞吐型"
            : "-",
    },
    {
      key: "mountTargetCount",
      title: "挂载点",
      width: 100,
      ellipsis: true,
      render: (_, item) => mountTargetCounts.get(item.id) ?? "-",
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 150,
      render: (_, item) => formatDateTime(item.created_at),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-wenjiancunchu",
          title: "文件存储",
          subtitle: "管理共享文件系统、挂载目标与访问方式",
          actions: [
            {
              key: "header-action-1",
              label: "创建文件存储",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{
          value: status,
          onChange: setStatus,
          items: [
            {
              value: "all",
              label: "全部",
            },
            {
              value: "available",
              label: "可用",
            },
            {
              value: "pending",
              label: "创建中",
            },
            {
              value: "failed",
              label: "异常",
            },
          ],
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
            spinning: filesystems.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={filesystems.isFetching}
          emptyIconClassName="icon-wenjiancunchu"
          emptyText={
            searchText || status !== "all"
              ? "没有符合条件的文件存储"
              : "还没有文件存储，点击「创建文件存储」开始"
          }
          tableLabel="文件存储列表"
          preserveTableOnEmpty
          pagination={{
            page,
            pageSize,
            total: paginationTotal,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </ListPageFrame>
      {createVisible && <CreateFilesystemModal onCancel={() => setCreateVisible(false)} />}
      {dialogNode}
    </>
  );
}

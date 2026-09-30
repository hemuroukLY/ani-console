import { useVolumeActions } from "@/hooks/useVolumeActions";

import { useQueryClient } from "@tanstack/react-query";

import { useMemo, useState } from "react";

import { listVolumes, type StorageVolume } from "@/api/storage/volumes";

import { CreateVolumeModal } from "@/components/storage/CreateVolumeModal";

import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
} from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { formatDateTime } from "@/lib/format";
import { VOLUME_MODE_LABELS } from "@/lib/volumes";

type Volume = StorageVolume;
type StatusFilter = "all" | "pending" | "available" | "mounted" | "failed";
type SearchField = "name" | "id";

export function VolumesPage() {
  const qc = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const {
    query: volumes,
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
    refresh,
  } = useCursorPaginatedQuery<Volume>({
    errorNotification: {
      id: "volumes",
      action: "块存储卷列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["volumes", { status, searchField, searchText }],
    cursorScope: `${status}:${searchField}:${searchText.trim()}`,
    fetchPage: async ({ cursor, limit }) => {
      const keyword = searchText.trim();
      return listVolumes({
        limit,
        cursor,
        state: status === "all" || status === "mounted" ? undefined : status,
        in_use: status === "mounted" ? true : undefined,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const { actions, dialogNode } = useVolumeActions(() => {
    resetPagination();
    void qc.invalidateQueries({ queryKey: ["volumes"] });
  });

  const items = useMemo(() => (volumes.data?.items ?? []) as Volume[], [volumes.data?.items]);

  const paginationTotal = volumes.data?.total ?? items.length;
  const columns: Array<ListColumn<Volume>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="volume" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} />,
    },
    {
      key: "size",
      title: "容量 (GiB)",
      width: 100,
      dataIndex: "size_gib",
    },
    {
      key: "storageClass",
      title: "类型",
      width: 100,
      dataIndex: "storage_class",
    },
    {
      key: "volumeMode",
      title: "用途",
      width: 120,
      render: (_, item) => VOLUME_MODE_LABELS[item.volume_mode] ?? "-",
    },
    {
      key: "encrypted",
      title: "加密",
      width: 80,
      render: (_, item) => (item.encrypted ? "是" : "否"),
    },
    {
      key: "zone",
      title: "可用区",
      width: 100,
      dataIndex: "zone",
      ellipsis: true,
      placeholder: "-",
    },
    {
      key: "mountInstance",
      title: "挂载实例",
      width: 150,
      ellipsis: true,
      render: (_, item) =>
        item.used_by
          ?.map((instance) => instance.instance_name)
          .filter(Boolean)
          .join("、") || "-",
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
          iconClassName: "icon-kuaicunchu",
          title: "块存储",
          subtitle: "管理可挂载到实例的块存储卷及快照",
          actions: [
            {
              key: "header-action-1",
              label: "创建卷",
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
              value: "pending",
              label: "创建中",
            },
            {
              value: "available",
              label: "可用",
            },
            {
              value: "mounted",
              label: "已挂载",
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
            spinning: volumes.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={volumes.isFetching}
          emptyIconClassName="icon-kuaicunchu"
          emptyText={
            searchText || status !== "all"
              ? "没有符合条件的块存储卷"
              : "还没有块存储卷，点击「创建卷」开始"
          }
          tableLabel="块存储卷列表"
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
      {createVisible && <CreateVolumeModal onCancel={() => setCreateVisible(false)} />}
      {dialogNode}
    </>
  );
}

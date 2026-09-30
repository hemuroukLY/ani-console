import { useBucketActions } from "@/hooks/useBucketActions";
import { useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { listBuckets, type StorageBucketRecord } from "@/api/storage/buckets";

import { CreateBucketModal } from "@/components/storage/CreateBucketModal";
import { ResourceNameId, ListPageFrame, type ListColumn, ListDataTable } from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { formatBytes, formatDateTime } from "@/lib/format";

type Bucket = StorageBucketRecord;
type SearchField = "name" | "id";

export function ObjectsPage() {
  const queryClient = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);

  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const {
    query: buckets,
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
    refresh,
  } = useCursorPaginatedQuery<Bucket>({
    errorNotification: {
      id: "buckets",
      action: "对象存储桶列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["buckets", { searchField, searchText }],
    cursorScope: `${searchField}:${searchText.trim()}`,
    fetchPage: async ({ cursor, limit }) => {
      const keyword = searchText.trim();
      return listBuckets({
        limit,
        cursor,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const { actions, dialogNode } = useBucketActions(() => {
    resetPagination();
    void queryClient.invalidateQueries({ queryKey: ["buckets"] });
  });
  const items = (buckets.data?.items ?? []) as Bucket[];
  const paginationTotal = buckets.data?.total ?? items.length;
  const columns: Array<ListColumn<Bucket>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="bucket" />,
    },
    {
      key: "acl",
      title: "权限",
      width: 100,
      render: (_, item) => (item.acl === "tenant_read" ? "租户内读" : "私有"),
    },
    {
      key: "storageClass",
      title: "存储类型",
      width: 100,
      render: (_, item) => (item.storage_class === "infrequent_access" ? "低频" : "标准"),
    },
    {
      key: "region",
      title: "Region",
      dataIndex: "region",
      width: 100,
      ellipsis: true,
      placeholder: "-",
    },
    {
      key: "objectCount",
      title: "对象数",
      dataIndex: "object_count",
      width: 100,
      ellipsis: true,
      placeholder: 0,
    },
    {
      key: "sizeBytes",
      title: "总大小",
      width: 100,
      ellipsis: true,
      render: (_, item) => formatBytes(item.size_bytes),
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
          iconClassName: "icon-duixiangcunchu1",
          title: "对象存储",
          subtitle: "S3 兼容存储桶，用于保存非结构化对象数据",
          actions: [
            {
              key: "header-action-1",
              label: "创建存储桶",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
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
            spinning: buckets.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={buckets.isFetching}
          emptyIconClassName="icon-duixiangcunchu1"
          emptyText={searchText ? "没有符合条件的存储桶" : "还没有存储桶，点击「创建存储桶」开始"}
          tableLabel="对象存储桶列表"
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
      <CreateBucketModal visible={createVisible} onCancel={() => setCreateVisible(false)} />
      {dialogNode}
    </>
  );
}

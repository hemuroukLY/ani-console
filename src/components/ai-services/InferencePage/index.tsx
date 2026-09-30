import { useInferenceActions } from "@/hooks/useInferenceActions";

import { Select, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { listInferenceServices, type InferenceService } from "@/api/ai-services/inference";

import { CreateInferenceServiceModal } from "@/components/ai-services/CreateInferenceServiceModal";
import { InferenceStatusTag } from "@/components/ai-services/InferenceStatusTag";
import { ResourceNameId, ListPageFrame, type ListColumn, ListDataTable } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type StatusFilter = "all" | "pending" | "deploying" | "running" | "stopping" | "stopped" | "failed";
type SearchField = "name" | "id";

export function InferencePage() {
  const { actions, dialogNode } = useInferenceActions();
  const [createVisible, setCreateVisible] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const [model, setModel] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const services = useQuery({
    meta: {
      errorNotification: {
        id: "inference-services",
        action: "推理服务列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["inference-services", { status, searchField, searchText, model, page, pageSize }],
    queryFn: async () => {
      const keyword = searchText.trim();
      return listInferenceServices({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        status: status === "all" ? undefined : status,
        model: model === "all" ? undefined : model,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });

  const items = useMemo(() => services.data?.items ?? [], [services.data?.items]);
  const modelOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.model))).map((value) => ({
        value,
        label: value,
      })),
    [items],
  );
  useEffect(() => setPage(1), [model, searchField, searchText, status]);
  const columns: Array<ListColumn<InferenceService>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => (
        <ResourceNameId name={item.name} id={item.id} type="inference-service" />
      ),
    },
    {
      key: "status",
      title: "状态",
      width: 120,
      render: (_, item) => <InferenceStatusTag {...item} />,
    },
    {
      key: "model",
      title: "模型版本",
      render: (_, item) => (
        <ResourceNameId
          name={item.served_model_name || "-"}
          id={item.model_version_id}
          openable={false}
          copyable={false}
        />
      ),
    },
    {
      key: "engine",
      title: "启动命令",
      render: (_, item) => item.engine?.command?.join(" ") || "-",
      ellipsis: true,
    },
    {
      key: "replicas",
      title: "副本",
      width: 80,
      render: (_, item) => `${item.ready_replicas} / ${item.replicas}`,
    },
    {
      key: "gpu",
      title: "GPU",
      ellipsis: true,
      render: (_, item) => {
        const accelerator = item.resources?.accelerator;
        const gpuType = item.gpu_type ?? accelerator?.spec_id;
        const gpuCount = item.gpu_count_per_pod || accelerator?.count_per_replica;
        return gpuType && gpuCount ? `${gpuType} × ${gpuCount}` : "-";
      },
    },
    {
      key: "invocationUrl",
      title: "调用地址",
      ellipsis: true,
      render: (_, item) => item.invocation_url ?? item.endpoint_url ?? "-",
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
          iconClassName: "icon-tuili",
          title: "推理服务",
          subtitle: "部署模型并管理推理运行实例",
          actions: [
            {
              key: "header-action-1",
              label: "一键部署",
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
              label: "等待中",
            },
            {
              value: "running",
              label: "运行中",
            },
            {
              value: "deploying",
              label: "部署中",
            },
            {
              value: "stopping",
              label: "停止中",
            },
            {
              value: "stopped",
              label: "已停止",
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
          filters: (
            <Space wrap>
              <Select
                value={model}
                onChange={setModel}
                className="w-55"
                options={[
                  {
                    value: "all",
                    label: "全部模型",
                  },
                  ...modelOptions,
                ]}
              />
            </Space>
          ),
          refresh: {
            label: "刷新",
            spinning: services.isFetching,
            onClick: () => void services.refetch(),
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={services.isFetching}
          pagination={{
            page,
            pageSize,
            total: services.data?.total ?? items.length,
            onPageChange: setPage,
            onPageSizeChange: (next) => {
              setPageSize(next);
              setPage(1);
            },
          }}
          preserveTableOnEmpty
          emptyIconClassName="icon-tuili"
          emptyText={
            searchText || model !== "all" || status !== "all"
              ? "没有符合条件的推理服务"
              : "还没有推理服务，可从模型仓库一键部署"
          }
          tableLabel="推理服务列表"
        />
      </ListPageFrame>
      {createVisible && <CreateInferenceServiceModal onCancel={() => setCreateVisible(false)} />}
      {dialogNode}
    </>
  );
}

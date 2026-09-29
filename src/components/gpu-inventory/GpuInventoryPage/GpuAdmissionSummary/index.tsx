import { Alert, Card, Empty, Progress, Skeleton, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getGpuSpecAvailability } from "@/api/gpu-inventory";
import { StatusBadge } from "@/components/common";

export function GpuAdmissionSummary() {
  const availability = useQuery({
    meta: {
      errorNotification: {
        id: "gpu-spec-availability-summary",
        action: "GPU 规格可用性加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["gpu-specs", "availability"],
    queryFn: getGpuSpecAvailability,
  });
  const specs = availability.data?.items ?? [];
  const availableSpecs = specs.filter(
    (item) => item.status === "available" && item.available_count > 0,
  ).length;
  const quotaFullSpecs = specs.filter((item) => item.status === "full").length;
  const deviceFullSpecs = specs.filter((item) => item.status === "device_full").length;
  const unavailableSpecs = specs.filter((item) => item.status === "unavailable").length;
  const canCreate = availableSpecs > 0 && (availability.data?.quota_remaining ?? 0) > 0;

  return (
    <Card
      className="h-full rounded-lg!"
      bodyStyle={{
        padding: 24,
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Typography.Title heading={5} className="m-0!">
          创建准入预检
        </Typography.Title>
        <Typography.Text type="secondary">按实时调度结果复核</Typography.Text>
      </div>
      {availability.isLoading ? (
        <Skeleton animation text={{ rows: 5 }} />
      ) : specs.length === 0 ? (
        <div className="flex min-h-56 flex-1 items-center justify-center">
          <Empty description="当前没有 GPU 规格可供预检" />
        </div>
      ) : (
        <div className="flex min-h-70 flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-5">
            <Progress
              type="circle"
              width={128}
              strokeWidth={10}
              percent={Math.round((availableSpecs / specs.length) * 100)}
            />
            <div className="min-w-0 flex-1 basis-64">
              <Typography.Title heading={5} className="mb-1! mt-0!">
                {availableSpecs} / {specs.length} 个规格可创建
              </Typography.Title>
              <Typography.Text type="secondary">
                配额余量 {availability.data?.quota_remaining ?? "-"}
                ，提交创建时仍以实时调度结果为准
              </Typography.Text>
            </div>
          </div>
          <Space wrap>
            <StatusBadge tone="success">可用 {availableSpecs}</StatusBadge>
            <StatusBadge tone="warning">配额不足 {quotaFullSpecs}</StatusBadge>
            <StatusBadge tone="warning">设备不足 {deviceFullSpecs}</StatusBadge>
            <StatusBadge tone="danger">不可用 {unavailableSpecs}</StatusBadge>
          </Space>
          <Alert
            className="mt-auto"
            type={canCreate ? "success" : "warning"}
            showIcon
            content={
              canCreate
                ? "当前存在可用规格，可进入创建流程选择具体规格和调度队列。"
                : "当前没有满足配额与设备条件的规格，创建请求可能被拒绝。"
            }
          />
        </div>
      )}
    </Card>
  );
}

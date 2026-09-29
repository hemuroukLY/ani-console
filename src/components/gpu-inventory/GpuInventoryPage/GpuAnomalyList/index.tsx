import { StatusBadge } from "@/components/common";
import { Card, Empty, Skeleton, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listGpuAnomalies, type GpuInventoryRecord } from "@/api/gpu-inventory";

const statusLabel: Record<GpuInventoryRecord["status"], string> = {
  available: "空闲",
  in_use: "占用中",
  fault: "故障",
  maintenance: "维护",
};

export function GpuAnomalyList() {
  const anomalyQuery = useQuery({
    meta: {
      errorNotification: {
        id: "gpu-inventory-anomalies",
        action: "GPU 异常数据加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["gpu-inventory", "anomalies"],
    queryFn: listGpuAnomalies,
  });
  const anomalies = anomalyQuery.data ?? [];
  return (
    <Card
      title="异常"
      className="h-full rounded-lg!"
      extra={<Typography.Text type="secondary">{anomalies.length} 项</Typography.Text>}
    >
      {anomalyQuery.isLoading ? (
        <Skeleton animation text={{ rows: 4 }} />
      ) : anomalies.length === 0 ? (
        <div className="flex min-h-28 items-center justify-center">
          <Empty
            description={
              <div className="space-y-1">
                <div>当前无 GPU 异常</div>
                <Typography.Text type="secondary">故障或维护中的卡会在这里列出</Typography.Text>
              </div>
            }
          />
        </div>
      ) : (
        <Space direction="vertical" size={10} className="w-full">
          {anomalies.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded bg-fill-2 px-4 py-3"
            >
              <Space size={8}>
                <StatusBadge
                  status={item.status}
                  tone={item.status === "fault" ? "danger" : "warning"}
                >
                  {statusLabel[item.status]}
                </StatusBadge>
                <Typography.Text>{item.gpu_type}</Typography.Text>
              </Space>
              <Typography.Text type="secondary">{item.node_name}</Typography.Text>
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
}

import { Card, Skeleton, Typography } from "@arco-design/web-react";
import type { EChartsOption } from "echarts";
import { CorePieChart } from "@/components/common";
import { useGpuOccupancyQuery } from "../useGpuOccupancyQuery";

export function GpuInventoryDistribution({ kind }: { kind: "vendor" | "model" }) {
  const occupancy = useGpuOccupancyQuery();
  // 库存接口尚未提供厂商维度，保留空环，不从型号名称猜测厂商。
  const items =
    kind === "model"
      ? (occupancy.data?.by_gpu_type ?? []).map((item) => ({
          name: item.gpu_type || "-",
          value: item.total ?? 0,
        }))
      : [];
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;
  const option: EChartsOption = {
    tooltip: { trigger: "item", show: hasData, confine: true },
    legend: { type: "scroll", bottom: 0, show: hasData },
    series: [
      {
        type: "pie",
        radius: ["46%", "72%"],
        center: ["50%", "43%"],
        label: { show: false },
        silent: !hasData,
        data: items,
      },
    ],
  };

  return (
    <Card className="h-full min-w-0 rounded-lg!" bodyStyle={{ padding: 24 }}>
      <Typography.Title heading={5} className="mt-0! mb-4!">
        {kind === "vendor" ? "厂商分布" : "型号分布"}
      </Typography.Title>
      {kind === "model" && occupancy.isLoading ? (
        <Skeleton animation text={{ rows: 8 }} />
      ) : (
        <div className="relative">
          {hasData ? (
            <CorePieChart option={option} style={{ height: 280, width: "100%" }} />
          ) : (
            <div className="relative h-70" aria-hidden="true">
              <div className="absolute left-1/2 top-[43%] box-border aspect-square w-[72%] max-w-50 -translate-x-1/2 -translate-y-1/2 rounded-full border-28 border-solid border-app-fill-strong" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-[43%] flex -translate-y-1/2 flex-col items-center">
            <span className="text-3xl font-semibold text-app-text">{hasData ? total : "-"}</span>
            <Typography.Text type="secondary">{hasData ? "总计" : "暂无数据"}</Typography.Text>
          </div>
        </div>
      )}
    </Card>
  );
}

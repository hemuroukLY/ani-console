import { Card, Skeleton, Statistic, Typography } from "@arco-design/web-react";
import { IconApps, IconUser } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getMyQuota } from "@/api/gpu-inventory";

function CapacityMetric({
  loading = false,
  title,
  value,
  unit,
  extra,
  icon,
}: {
  loading?: boolean;
  title: string;
  value: string | number;
  unit?: ReactNode;
  extra: string;
  icon: ReactNode;
}) {
  return (
    <Card className="h-full min-w-0 rounded-lg!" bodyStyle={{ padding: 24 }}>
      {loading ? (
        <Skeleton animation text={{ rows: 3 }} />
      ) : (
        <div className="flex min-h-36 items-center gap-5">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-fill text-2xl text-app-text-secondary"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <Statistic
              title={title}
              value={value}
              suffix={unit}
              styleValue={{ fontSize: 36, fontWeight: 600, lineHeight: 1.3 }}
            />
            <Typography.Text type="secondary" className="mt-1 block">
              {extra}
            </Typography.Text>
          </div>
        </div>
      )}
    </Card>
  );
}

export function GpuCapacityMetrics() {
  const tenantQuota = useQuery({
    meta: {
      errorNotification: {
        id: "gpu-tenant-quota",
        action: "租户 GPU 配额加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["quotas", "me"],
    queryFn: getMyQuota,
  });
  const gpuQuota = tenantQuota.data?.items.find((item) => item.resource_type === "gpu_count");

  return (
    <>
      <CapacityMetric
        loading={tenantQuota.isLoading}
        title="配额卡数"
        value={gpuQuota?.used ?? "-"}
        unit={
          <span className="text-base font-normal text-app-text-tertiary">
            / {gpuQuota?.total ?? "-"}
          </span>
        }
        extra="已用 / 上限"
        icon={<IconApps />}
      />
      <CapacityMetric
        loading={tenantQuota.isLoading}
        title="本租户预留"
        value={gpuQuota?.reserved ?? "-"}
        extra="平台已分配、尚未创建实例"
        icon={<IconUser />}
      />
    </>
  );
}

import { useNetworkRouteActions } from "@/hooks/useNetworkRouteActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";

import { getNetworkRoute, getNetworkVpc, type NetworkRoute, type NetworkVPC } from "@/api/network";

import { AliIcon, DetailPageFrame, DetailPagePlaceholder, ResourceId } from "@/components/common";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/format";
import { NetworkRouteRelatedResources } from "./NetworkRouteRelatedResources";

export function NetworkRouteDetailPage({ routeId }: { routeId: string }) {
  const goBack = useBackOrFallback("network-route");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("route", routeId),
        action: `路由加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-route", routeId],
    queryFn: () => getNetworkRoute(routeId),
  });
  const vpc = useQuery({
    meta: {
      errorNotification: {
        id: withId("route-vpc", routeId),
        action: "VPC 加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpc", detail.data?.vpc_id],
    queryFn: () => getNetworkVpc(detail.data!.vpc_id),
    enabled: Boolean(detail.data?.vpc_id),
  });
  const { actions } = useNetworkRouteActions(goBack);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const item = detail.data as NetworkRoute;
  const parentVpc = vpc.data as NetworkVPC | undefined;
  const name = item.description?.trim() || item.destination_cidr;
  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/routes"), { label: name }]}
      title={name}
      icon={<AliIcon name="VPCluyouqi" size={28} />}
      headerItems={[{ label: "目标网段", value: item.destination_cidr }]}
      actions={<ResourceActionMenu record={item} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={item.id} /> },
            {
              label: "VPC",
              value: parentVpc?.name ?? (vpc.isLoading ? "加载中…" : item.vpc_id),
            },
            { label: "目标网段", value: item.destination_cidr },
            {
              label: "下一跳类型",
              value:
                item.next_hop_type === "instance"
                  ? "实例"
                  : item.next_hop_type === "nat"
                    ? "NAT"
                    : "网关",
            },
            { label: "下一跳", value: item.next_hop_id },
            { label: "创建时间", value: formatDateTime(item.created_at) },
          ],
        },
      ]}
      tabs={[
        {
          key: "related",
          label: "关联资源",
          content: (
            <NetworkRouteRelatedResources
              route={item}
              parentVpc={parentVpc}
              vpcLoading={vpc.isLoading}
            />
          ),
        },
      ]}

      onBack={goBack}
    />
  );
}

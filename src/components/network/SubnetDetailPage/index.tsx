import { useSubnetActions } from "@/hooks/useSubnetActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";

import {
  getNetworkSubnet,
  getNetworkVpc,
  type NetworkSubnet,
  type NetworkVPC,
} from "@/api/network";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { withId } from "@/lib/id";

import { useQuery } from "@tanstack/react-query";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";

type Subnet = NetworkSubnet;
type Vpc = NetworkVPC;
import { SubnetRelatedResources } from "./SubnetRelatedResources";
import { SubnetRoutes } from "./SubnetRoutes";

export function SubnetDetailPage({
  subnetId,
  tab,
  onTabChange,
}: {
  subnetId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("subnet");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("subnet", subnetId),
        action: `子网加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-subnet", subnetId],
    queryFn: () => getNetworkSubnet(subnetId),
  });
  const vpc = useQuery({
    meta: {
      errorNotification: {
        id: withId("subnet-vpc", subnetId),
        action: `VPC 加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpc", detail.data?.vpc_id],
    queryFn: () => getNetworkVpc(detail.data!.vpc_id),
    enabled: Boolean(detail.data?.vpc_id),
  });
  const { actions } = useSubnetActions(goBack);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const subnet = detail.data as Subnet;
  const parentVpc = vpc.data as Vpc | undefined;

  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/subnets"), { label: subnet.name }]}
      title={subnet.name}
      status={<StatusBadge status={subnet.state} />}
      icon={<AliIcon name="VPCwangluo" size={28} />}
      headerItems={[{ label: "CIDR", value: subnet.cidr }]}
      actions={<ResourceActionMenu record={subnet} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={subnet.id} /> },
            {
              label: "VPC",
              value: parentVpc?.name ?? (vpc.isLoading ? "加载中…" : subnet.vpc_id),
            },
            { label: "CIDR", value: subnet.cidr },
            { label: "网关", value: subnet.gateway ?? "-" },
            { label: "创建时间", value: formatDateTime(subnet.created_at) },
            { label: "更新时间", value: formatDateTime(subnet.updated_at) },
          ],
        },
      ]}
      tabs={[
        {
          key: "routes",
          label: "路由",
          content: <SubnetRoutes subnetId={subnetId} vpcId={subnet.vpc_id} />,
        },
        {
          key: "related",
          label: "关联资源",
          content: <SubnetRelatedResources subnetId={subnetId} />,
        },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
      onBack={goBack}
    />
  );
}

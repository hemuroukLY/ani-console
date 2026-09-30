import { useVpcActions } from "@/hooks/useVpcActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";
import {
  DetailPageFrame,
  DetailPagePlaceholder,
  AliIcon,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";

import { getNetworkVpc, type NetworkVPC } from "@/api/network";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { VpcRelatedResources } from "./VpcRelatedResources";
import { VpcRoutes } from "./VpcRoutes";
import { VpcSubnets } from "./VpcSubnets";

type Vpc = NetworkVPC;

export function VpcDetailPage({
  vpcId,
  tab,
  onTabChange,
}: {
  vpcId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("vpc");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("vpc", vpcId),
        action: `VPC 加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpc", vpcId],
    queryFn: () => getNetworkVpc(vpcId),
  });
  const { actions } = useVpcActions(goBack);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const vpc = detail.data as Vpc;

  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/vpcs"), { label: vpc.name }]}
      title={vpc.name}
      status={<StatusBadge status={vpc.state} />}
      icon={<AliIcon name="VPCwangluo" size={28} />}
      headerItems={[{ label: "CIDR", value: vpc.cidr }]}
      actions={<ResourceActionMenu record={vpc} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={vpc.id} /> },
            { label: "CIDR", value: vpc.cidr },
            { label: "创建时间", value: formatDateTime(vpc.created_at) },
            { label: "更新时间", value: formatDateTime(vpc.updated_at) },
          ],
        },
      ]}
      tabs={[
        {
          key: "subnets",
          label: "子网",
          content: <VpcSubnets vpcId={vpcId} />,
        },
        {
          key: "routes",
          label: "路由",
          content: <VpcRoutes vpcId={vpcId} />,
        },
        {
          key: "related",
          label: "关联资源",
          content: <VpcRelatedResources vpcId={vpcId} />,
        },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
      onBack={goBack}
    />
  );
}

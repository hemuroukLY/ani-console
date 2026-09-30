import { useSecurityGroupActions } from "@/hooks/useSecurityGroupActions";
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

import {
  getNetworkSecurityGroup,
  getNetworkVpc,
  type NetworkSecurityGroup,
  type NetworkVPC,
} from "@/api/network";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { SecurityGroupRelatedResources } from "./SecurityGroupRelatedResources";
import { SecurityGroupRules } from "./SecurityGroupRules";

type SecurityGroup = NetworkSecurityGroup;
type Vpc = NetworkVPC;

export function SecurityGroupDetailPage({ securityGroupId }: { securityGroupId: string }) {
  const goBack = useBackOrFallback("security-group");
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("security-group", securityGroupId),
        action: `安全组加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-security-group", securityGroupId],
    queryFn: () => getNetworkSecurityGroup(securityGroupId),
  });
  const vpc = useQuery({
    meta: {
      errorNotification: {
        id: withId("security-group-vpc", securityGroupId),
        action: `VPC 加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpc", detail.data?.vpc_id],
    queryFn: () => getNetworkVpc(detail.data!.vpc_id!),
    enabled: Boolean(detail.data?.vpc_id),
  });
  const { actions } = useSecurityGroupActions(goBack);

  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const securityGroup = detail.data as SecurityGroup;
  const parentVpc = vpc.data as Vpc | undefined;
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[
          ...navigationBreadcrumbsForPath("/security-groups"),
          { label: securityGroup.name },
        ]}
        title={securityGroup.name}
        status={<StatusBadge status={securityGroup.state} />}
        icon={<AliIcon name="anquanzu" size={28} />}
        headerItems={[
          {
            label: "VPC",
            value: parentVpc?.name ?? securityGroup.vpc_id ?? "-",
          },
        ]}
        actions={<ResourceActionMenu record={securityGroup} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "ID", value: <ResourceId value={securityGroup.id} /> },
              {
                label: "VPC",
                value: parentVpc?.name ?? securityGroup.vpc_id ?? "-",
              },
              { label: "描述", value: securityGroup.description || "-" },
              {
                label: "创建时间",
                value: formatDateTime(securityGroup.created_at),
              },
              {
                label: "更新时间",
                value: formatDateTime(securityGroup.updated_at),
              },
            ],
          },
        ]}
        tabs={[
          {
            key: "ingress",
            label: "入站规则",
            content: <SecurityGroupRules securityGroupId={securityGroupId} direction="ingress" />,
          },
          {
            key: "egress",
            label: "出站规则",
            content: <SecurityGroupRules securityGroupId={securityGroupId} direction="egress" />,
          },
          {
            key: "related",
            label: "关联资源",
            content: (
              <SecurityGroupRelatedResources
                securityGroupId={securityGroupId}
                parentVpc={parentVpc}
                vpcLoading={vpc.isLoading}
              />
            ),
          },
        ]}
        onBack={goBack}
      />
    </>
  );
}

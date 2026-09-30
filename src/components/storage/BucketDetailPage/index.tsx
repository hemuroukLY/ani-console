import { useBucketActions } from "@/hooks/useBucketActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { AliIcon, DetailPageFrame, DetailPagePlaceholder, ResourceId } from "@/components/common";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "@arco-design/web-react";

import { getBucket, type StorageBucketRecord } from "@/api/storage/buckets";

import { BucketAclEditor } from "@/components/storage/BucketAclEditor";

import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { formatBytes, formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { BucketAccess } from "./BucketAccess";
import { BucketLifecycle } from "./BucketLifecycle";
import { BucketObjects } from "./BucketObjects";

type Bucket = StorageBucketRecord;

export function BucketDetailPage({
  bucketId,
  tab,
  onTabChange,
}: {
  bucketId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("bucket");

  const { actions, dialogNode } = useBucketActions(goBack);
  const bucket = useQuery({
    meta: {
      errorNotification: {
        id: withId("bucket", bucketId),
        action: "存储桶加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["bucket", bucketId],
    queryFn: () => getBucket(bucketId),
  });
  if (!bucket.data) return <DetailPagePlaceholder loading={bucket.isLoading} />;

  const bucketInfo = bucket.data as Bucket;
  const aclLabel = bucketInfo.acl === "tenant_read" ? "租户内读" : "私有";
  const storageClassLabel = bucketInfo.storage_class === "infrequent_access" ? "低频" : "标准";
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[...navigationBreadcrumbsForPath("/objects"), { label: bucketInfo.name }]}
        title={bucketInfo.name}
        status={<Tag color={bucketInfo.acl === "tenant_read" ? "blue" : "gray"}>{aclLabel}</Tag>}
        icon={<AliIcon name="duixiangcunchu1" size={28} />}
        headerItems={[
          {
            label: "对象数",
            value: String(bucketInfo.object_count ?? 0),
          },
        ]}
        actions={<ResourceActionMenu record={bucketInfo} actions={actions} />}
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "存储桶ID", value: <ResourceId value={bucketInfo.id} /> },
              { label: "存储桶名称", value: bucketInfo.name },
              { label: "权限", value: aclLabel },
              { label: "存储类型", value: storageClassLabel },
              {
                label: "对象数",
                value: bucketInfo.object_count ?? 0,
              },
              { label: "总大小", value: formatBytes(bucketInfo.size_bytes) },
              {
                label: "创建时间",
                value: formatDateTime(bucketInfo.created_at),
              },
              {
                label: "更新时间",
                value: formatDateTime(bucketInfo.updated_at),
              },
            ],
          },
        ]}

        tabs={[
          {
            key: "objects",
            label: "文件",
            content: <BucketObjects bucketId={bucketId} bucket={bucketInfo} />,
          },
          {
            key: "permissions",
            label: "权限管理",
            content: <BucketAclEditor bucket={bucketInfo} />,
          },
          {
            key: "lifecycle",
            label: "生命周期",
            content: <BucketLifecycle bucketId={bucketId} />,
          },
          {
            key: "access",
            label: "访问域名",
            content: <BucketAccess bucket={bucketInfo} />,
          },
        ]}
        activeTabKey={tab}
        onTabChange={onTabChange}
        onBack={goBack}
      />
      {dialogNode}
    </>
  );
}

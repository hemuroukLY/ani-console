import { useObjectActions } from "@/hooks/useObjectActions";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { withId } from "@/lib/id";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";

import { getStorageObject, type StorageObject } from "@/api/storage/objects";

import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";

import { formatBytes, formatDateTime } from "@/lib/format";

export function ObjectDetailPage({ bucketId, objectId }: { bucketId: string; objectId: string }) {
  const goBack = useBackOrFallback("object", bucketId);

  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("object", objectId),
        action: "对象加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["object", objectId],
    queryFn: () => getStorageObject(objectId),
  });
  const { actions } = useObjectActions(bucketId, goBack);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;

  const object = detail.data as StorageObject;
  const objectStatus = <StatusBadge status={object.state} reason={object.reason} />;

  return (
    <DetailPageFrame
      breadcrumbs={[
        ...navigationBreadcrumbsForPath("/objects"),
        {
          label: object.bucket,
          to: "/objects/$bucketId",
          params: { bucketId },
        },
        { label: object.key },
      ]}
      title={object.key}
      status={objectStatus}
      icon={<AliIcon name="file" size={28} />}
      headerItems={[{ label: "大小", value: formatBytes(object.size_bytes) }]}
      actions={<ResourceActionMenu record={object} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={object.id} /> },
            { label: "Bucket", value: object.bucket },
            { label: "Key", value: object.key },
            { label: "大小", value: formatBytes(object.size_bytes) },
            { label: "类型", value: object.content_type },
            { label: "创建时间", value: formatDateTime(object.created_at) },
            { label: "更新时间", value: formatDateTime(object.updated_at) },
          ],
        },
      ]}
      onBack={goBack}
    />
  );
}

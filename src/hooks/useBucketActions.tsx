import { useMutation } from "@tanstack/react-query";
import { Modal } from "@arco-design/web-react";
import { useState } from "react";
import { deleteBucket, type StorageBucketRecord } from "@/api/storage/buckets";
import { BucketAclModal } from "@/components/storage/BucketAclModal";
import { BucketUploadModal } from "@/components/storage/BucketUploadModal";
import { BucketStorageClassModal } from "@/components/storage/BucketStorageClassModal";
import type { RowAction } from "@/components/common";
type Bucket = StorageBucketRecord;
export function useBucketActions(onDeleted: () => void) {
  const [uploadBucket, setUploadBucket] = useState<Bucket>();
  const [aclBucket, setAclBucket] = useState<Bucket>();
  const [storageClassBucket, setStorageClassBucket] = useState<Bucket>();
  const removeBucket = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "bucket-delete",
        action: "删除",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (bucket: Bucket) => deleteBucket(bucket.id),
    onSuccess: onDeleted,
  });
  const actions: RowAction<Bucket>[] = [
    { key: "storage-class", label: "存储类型", onClick: setStorageClassBucket },
    {
      key: "upload",
      label: "上传",
      onClick: setUploadBucket,
    },
    {
      key: "permissions",
      label: "改权限",
      onClick: setAclBucket,
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      loading: (item) => removeBucket.isPending && removeBucket.variables?.id === item.id,
      onClick: (item) =>
        void Modal.confirm({
          title: "删除存储桶",
          content: `确定删除「${item.name}」？请先清空桶内对象，删除后不可恢复。`,
          okButtonProps: { status: "danger" },
          onOk: () => removeBucket.mutateAsync(item),
        }),
    },
  ];
  const dialogNode = (
    <>
      {uploadBucket && (
        <BucketUploadModal bucket={uploadBucket} onCancel={() => setUploadBucket(undefined)} />
      )}
      {aclBucket && <BucketAclModal bucket={aclBucket} onCancel={() => setAclBucket(undefined)} />}
      {storageClassBucket && (
        <BucketStorageClassModal
          bucket={storageClassBucket}
          onCancel={() => setStorageClassBucket(undefined)}
        />
      )}
    </>
  );
  return { actions, dialogNode };
}

import { useBucketUpload } from "@/hooks/useBucketUpload";
import { useObjectActions } from "@/hooks/useObjectActions";
import {
  listBucketObjects,
  type StorageBucketObjectEntry,
  type StorageBucketRecord,
} from "@/api/storage/buckets";
import { ObjectBrowser } from "@/components/storage/ObjectBrowser";
import { withId } from "@/lib/id";
import { Button, Upload } from "@arco-design/web-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BucketFolderCreateModal } from "@/components/storage/BucketFolderCreateModal";

export function BucketObjects({
  bucketId,
  bucket,
}: {
  bucketId: string;
  bucket: StorageBucketRecord;
}) {
  const qc = useQueryClient();
  const [folderVisible, setFolderVisible] = useState(false);
  const [prefix, setPrefix] = useState("/");

  const objects = useQuery({
    meta: {
      errorNotification: {
        id: withId("bucket-objects", bucketId, prefix),
        action: "对象列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["bucket-objects", bucketId, prefix],
    queryFn: () => listBucketObjects(bucketId, { prefix, limit: 100 }),
  });
  const entries = (objects.data?.items ?? []) as StorageBucketObjectEntry[];
  const { actions } = useObjectActions(bucketId);
  const upload = useBucketUpload(bucketId, prefix);
  const dialogNode = folderVisible ? (
    <BucketFolderCreateModal
      bucketId={bucketId}
      prefix={prefix}
      onCancel={() => setFolderVisible(false)}
      onCreated={() => {
        void qc.invalidateQueries({ queryKey: ["bucket", bucketId] });
        void qc.invalidateQueries({ queryKey: ["bucket-objects", bucketId] });
        void qc.invalidateQueries({ queryKey: ["buckets"] });
      }}
    />
  ) : null;
  const openFolder = () => setFolderVisible(true);
  const aclLabel = bucket.acl === "tenant_read" ? "租户内读" : "私有";
  return (
    <>
      <ObjectBrowser
        bucketName={bucket.name}
        prefix={prefix}
        entries={entries}
        aclLabel={aclLabel}
        loading={objects.isLoading}
        actions={actions}
        primaryAction={
          <Upload
            showUploadList={false}
            customRequest={(option) => upload.mutate(option.file as File)}
          >
            <Button type="primary" loading={upload.isPending}>
              上传对象
            </Button>
          </Upload>
        }
        onNavigate={(target) => {
          setPrefix(target);
        }}
        onCreateFolder={openFolder}
      />
      {dialogNode}
    </>
  );
}

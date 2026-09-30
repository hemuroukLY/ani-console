import { useBucketUpload } from "@/hooks/useBucketUpload";
import type { StorageBucketRecord } from "@/api/storage/buckets";

import { Button, Modal, Space, Typography, Upload } from "@arco-design/web-react";

type BucketUploadModalProps = {
  bucket: StorageBucketRecord;
  onCancel: () => void;
};

export function BucketUploadModal({ bucket, onCancel }: BucketUploadModalProps) {
  const upload = useBucketUpload(bucket.id, "/", onCancel);

  return (
    <Modal
      visible
      title={`上传对象 · ${bucket.name}`}
      footer={null}
      onCancel={onCancel}
      unmountOnExit
    >
      <Space direction="vertical" size={16} className="w-full">
        <Typography.Text type="secondary">
          文件将上传到存储桶根目录，选择文件后立即开始上传。
        </Typography.Text>
        <Upload
          showUploadList={false}
          disabled={upload.isPending}
          customRequest={(options) => {
            upload.mutate(options.file as File);
            return { abort: () => undefined };
          }}
        >
          <Button type="primary" loading={upload.isPending}>
            选择文件并上传
          </Button>
        </Upload>
      </Space>
    </Modal>
  );
}

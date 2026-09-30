import { uploadStorageObjectFile } from "@/api/storage/objects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export function useBucketUpload(
  bucketId: string | undefined,
  prefix: string,
  onUploaded?: () => void,
) {
  const qc = useQueryClient();
  return useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "object-upload",
        action: "上传",
        errorFallback: "上传失败",
      },
    },
    mutationFn: (file: File) => {
      if (!bucketId) throw new Error("存储桶不存在");
      return uploadStorageObjectFile({ bucketId, file, prefix });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bucket", bucketId] });
      void qc.invalidateQueries({ queryKey: ["bucket-objects", bucketId] });
      void qc.invalidateQueries({ queryKey: ["buckets"] });
      onUploaded?.();
    },
  });
}

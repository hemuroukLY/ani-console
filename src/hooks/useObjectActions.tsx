import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@arco-design/web-react";
import { deleteBucketObject, generateBucketObjectPresignedUrl } from "@/api/storage/buckets";
import {
  completeStorageObjectUpload,
  deleteStorageObject,
  getStorageObjectDownload,
} from "@/api/storage/objects";
import { openExternalUrl } from "@/lib/browser";
import { copyToClipboard } from "@/lib/clipboard";
import type { RowAction } from "@/components/common";
type ObjectTarget = { id?: string; key: string; kind?: string; state?: string };
export function useObjectActions(bucketId: string, onDeleted?: () => void) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["bucket", bucketId] });
    void qc.invalidateQueries({ queryKey: ["bucket-objects", bucketId] });
    void qc.invalidateQueries({ queryKey: ["buckets"] });
  };
  const complete = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "object-complete-upload",
        action: "确认上传",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (item: ObjectTarget) => {
      if (!item.id) throw new Error("缺少对象 ID");
      return completeStorageObjectUpload(item.id);
    },
    onSuccess: (_, item) => {
      void qc.invalidateQueries({ queryKey: ["object", item.id] });
      refresh();
    },
  });
  const remove = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "object-delete",
        action: "删除",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async (item: ObjectTarget) => {
      if (item.id) await deleteStorageObject(item.id);
      else await deleteBucketObject(bucketId, item.key);
    },
    onSuccess: () => {
      if (onDeleted) onDeleted();
      else refresh();
    },
  });
  const link = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "object-link",
        action: "生成链接",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async ({ item, copy }: { item: ObjectTarget; copy: boolean }) => {
      const data =
        item.id && !copy
          ? await getStorageObjectDownload(item.id)
          : await generateBucketObjectPresignedUrl(bucketId, {
              key: item.key,
              method: "GET",
              expires_hours: 24,
            });
      if (!data.download_url) throw new Error("未返回下载链接");
      if (copy) await copyToClipboard(data.download_url, "临时链接");
      else openExternalUrl(data.download_url);
    },
  });
  const busy = () => remove.isPending || link.isPending || complete.isPending;
  const download = (item: ObjectTarget) => link.mutateAsync({ item, copy: false });
  const copyLink = (item: ObjectTarget) => link.mutateAsync({ item, copy: true });
  const copyPath = (item: ObjectTarget) => copyToClipboard(item.key, "对象路径");
  const confirmDelete = (item: ObjectTarget) => {
    if (busy()) return;
    Modal.confirm({
      title: item.kind === "prefix" ? "删除文件夹" : "删除对象",
      content: "确定删除「" + item.key + "」？",
      okButtonProps: { status: "danger" },
      onOk: () => remove.mutateAsync(item),
    });
  };
  const actions: RowAction<ObjectTarget>[] = [
    {
      key: "complete-upload",
      label: "确认上传完成",
      visible: (item) => Boolean(item.id) && item.state === "pending",
      disabled: busy,
      onClick: (item) => complete.mutateAsync(item),
    },
    {
      key: "copy-path",
      label: "复制路径",
      visible: (item) => item.kind !== "prefix",
      onClick: copyPath,
    },
    {
      key: "download",
      label: "下载",
      visible: (item) => item.kind !== "prefix",
      disabled: (item) => busy() || item.kind === "prefix" || item.state === "pending",
      onClick: download,
    },
    {
      key: "copy-link",
      label: "复制临时链接",
      visible: (item) => item.kind !== "prefix",
      disabled: (item) => busy() || item.kind === "prefix" || item.state === "pending",
      onClick: copyLink,
    },
    { key: "delete", label: "删除", intent: "danger", disabled: busy, onClick: confirmDelete },
  ];
  return { actions };
}

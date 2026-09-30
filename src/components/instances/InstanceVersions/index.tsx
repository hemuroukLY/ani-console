import { type InstanceRecord, applyInstanceLifecycle } from "@/api/instances";
import { InstanceReleases } from "@/components/instances/InstanceReleases";
import { Button, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { type RowAction } from "@/components/common";

type Release = NonNullable<NonNullable<InstanceRecord["container"]>["history"]>[number];

export function InstanceVersions({
  instance,
  onChanged,
  updateImage,
  rollbackDisabled,
}: {
  instance: InstanceRecord;
  onChanged: () => void;
  updateImage?: RowAction<InstanceRecord>;
  rollbackDisabled: boolean;
}) {
  const rollback = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "instance-release-rollback",
        action: "操作",
        successText: "回滚操作已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async (release: Release) => {
      await applyInstanceLifecycle(instance.id, {
        action: "rollback",
        revision: release.revision,
      });
    },
    onSuccess: onChanged,
  });
  const confirmRollback = (release: Release) => {
    if (rollbackDisabled || rollback.isPending || release.revision === instance.container?.revision)
      return;
    Modal.confirm({
      title: `回滚到 ${release.revision}`,
      content: `确定将「${instance.name}」回滚到版本 ${release.revision}？`,
      confirmLoading: rollback.isPending,
      onOk: () => rollback.mutateAsync(release),
    });
  };

  const actions: RowAction<Release>[] = [
    {
      key: "rollback",
      label: "回滚到此版本",
      disabled: (release) =>
        rollbackDisabled || rollback.isPending || release.revision === instance.container?.revision,
      loading: (release) => rollback.isPending && rollback.variables?.revision === release.revision,
      onClick: confirmRollback,
    },
  ];

  return (
    <InstanceReleases
      instance={instance}
      versionLayout
      actions={
        <Button
          disabled={!updateImage || updateImage.disabled?.(instance)}
          onClick={() => updateImage?.onClick(instance)}
        >
          更新镜像
        </Button>
      }
      revisionActions={actions}
    />
  );
}

import { Button, Space } from "@arco-design/web-react";
import type { InstanceRecord } from "@/api/instances";
import { ResourceActionMenu } from "@/components/common/ResourceActionMenu";
import { useSandboxInstanceActions } from "@/hooks/useSandboxInstanceActions";

export function SandboxInstanceActions({
  instance,
  onChanged,
  onDeleted,
}: {
  instance: InstanceRecord;
  onChanged: () => void;
  onDeleted?: () => void;
  display?: "row" | "detail";
}) {
  const { actions, dialogNode } = useSandboxInstanceActions(onChanged, onDeleted);
  const primaryAction = actions.find((action) => action.key === "terminal");
  return (
    <>
      <Space>
        <Button
          type="primary"
          disabled={!primaryAction || primaryAction.disabled?.(instance)}
          loading={primaryAction?.loading?.(instance)}
          onClick={() => primaryAction?.onClick(instance)}
        >
          远程终端
        </Button>
        <ResourceActionMenu
          record={instance}
          actions={actions.filter((action) => action.key !== "terminal")}
        />
      </Space>
      {dialogNode}
    </>
  );
}

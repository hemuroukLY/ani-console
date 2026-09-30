import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances";
import type { RowAction } from "@/components/common";
import { SandboxInstanceExtendModal } from "@/components/instances/SandboxInstanceExtendModal";
import { openSandboxInstanceTerminalWindow } from "@/lib/instances";
import { Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

type Instance = InstanceRecord;
type LifecycleAction = "pause" | "resume" | "extend" | "touch_idle" | "delete";

const TERMINAL_STATES = new Set(["expired", "deleted", "deleting"]);
const BUSY_STATES = new Set<Instance["state"]>([
  "pending",
  "provisioning",
  "starting",
  "stopping",
  "deleting",
]);

function sessionState(instance: Instance) {
  return instance.sandbox?.session_state ?? instance.state;
}

export function useSandboxInstanceActions(onChanged: () => void, onDeleted?: () => void) {
  const [extendTarget, setExtendTarget] = useState<Instance>();
  const lifecycle = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "sandbox-lifecycle",
        action: "操作",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async ({
      instance,
      action,
      duration,
    }: {
      instance: Instance;
      action: LifecycleAction;
      duration?: string;
    }) => {
      await applyInstanceLifecycle(instance.id, { action, duration });
    },
    onSuccess: (_, { action }) => {
      if (action === "delete" && onDeleted) onDeleted();
      else onChanged();
    },
  });

  const pending = (instance: Instance) =>
    lifecycle.isPending && lifecycle.variables?.instance.id === instance.id;
  const busy = (instance: Instance) => pending(instance) || BUSY_STATES.has(instance.state);
  const running = (instance: Instance) => sessionState(instance) === "running";
  const resumable = (instance: Instance) =>
    sessionState(instance) === "paused" || sessionState(instance) === "stopped";

  const actions: Array<RowAction<Instance>> = [
    {
      key: "lifecycle",
      label: (instance) => (running(instance) ? "暂停" : "恢复"),
      widthLabel: "暂停",
      disabled: (instance) => busy(instance) || (!running(instance) && !resumable(instance)),
      loading: pending,
      onClick: (instance) =>
        lifecycle.mutateAsync({ instance, action: running(instance) ? "pause" : "resume" }),
    },
    {
      key: "extend",
      label: "延长会话",
      disabled: (instance) => busy(instance) || TERMINAL_STATES.has(sessionState(instance)),
      onClick: setExtendTarget,
    },
    {
      key: "touch-idle",
      label: "活跃续期",
      disabled: (instance) => busy(instance) || !running(instance),
      onClick: (instance) => lifecycle.mutateAsync({ instance, action: "touch_idle" }),
    },
    {
      key: "terminal",
      label: "远程终端",
      disabled: (instance) => !running(instance) || instance.access?.exec_available === false,
      onClick: (instance) => openSandboxInstanceTerminalWindow(instance.id),
    },
    {
      key: "delete",
      label: "销毁",
      intent: "danger",
      disabled: (instance) => busy(instance) || sessionState(instance) === "deleted",
      onClick: (instance) =>
        void Modal.confirm({
          title: "销毁沙箱",
          content: `确认销毁「${instance.name || instance.id}」？工作区和未保存数据将不可恢复。`,
          okButtonProps: { status: "danger" },
          onOk: () => lifecycle.mutateAsync({ instance, action: "delete" }),
        }),
    },
  ];

  const dialogNode = extendTarget ? (
    <SandboxInstanceExtendModal
      instance={extendTarget}
      onCancel={() => setExtendTarget(undefined)}
      onSubmitted={() => {
        setExtendTarget(undefined);
        onChanged();
      }}
    />
  ) : null;

  return { dialogNode, actions };
}

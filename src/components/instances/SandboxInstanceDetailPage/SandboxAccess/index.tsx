import {
  type InstanceRecord,
  type SandboxInstanceStatus,
  deleteSandboxPort,
} from "@/api/instances";
import { DataTable, StatusBadge, type RowAction } from "@/components/common";
import { Button, Empty, Space, Typography, Modal } from "@arco-design/web-react";
import { copyToClipboard } from "@/lib/clipboard";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { SandboxPortOpenModal } from "@/components/instances/SandboxPortOpenModal";
import { SandboxTokenIssueModal } from "@/components/instances/SandboxTokenIssueModal";

type SandboxInstance = InstanceRecord;
type SandboxStatus = NonNullable<SandboxInstanceStatus>;
type SandboxPortSummary = NonNullable<SandboxStatus["ports"]>[number];

export function SandboxAccess({
  instance,
  onChanged,
}: {
  instance: SandboxInstance;
  onChanged: () => void;
}) {
  const sandbox = instance.sandbox!;

  const [tokenVisible, setTokenVisible] = useState(false);
  const [portVisible, setPortVisible] = useState(false);
  const running = sandbox.session_state === "running";
  const tokenAvailable = sandbox.connectivity?.token_available !== false;
  const portsAvailable = sandbox.connectivity?.ports_available !== false;

  const closePort = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "sandbox-port-close",
        action: "预览端口关闭",
        successText: "预览端口已关闭",
        errorFallback: "预览端口关闭失败",
      },
    },
    mutationFn: async (targetPort: number) => {
      await deleteSandboxPort(instance.id, targetPort);
      return targetPort;
    },
    onSuccess: () => {
      onChanged();
    },
  });

  const confirmClosePort = (targetPort: number) => {
    Modal.confirm({
      title: `关闭预览端口 ${targetPort}`,
      content: "关闭后，现有临时预览地址将不可继续访问。",
      okButtonProps: { status: "danger" },
      onOk: () => closePort.mutateAsync(targetPort),
    });
  };

  const actions: RowAction<SandboxPortSummary>[] = [
    {
      key: "copy",
      label: "复制",
      disabled: (item) => !item.preview_url,
      onClick: (item) => {
        if (item.preview_url) void copyToClipboard(item.preview_url, "预览地址");
      },
    },
    {
      key: "close",
      label: "关闭",
      intent: "danger",
      disabled: () => closePort.isPending,
      onClick: (item) => confirmClosePort(item.port),
    },
  ];
  const dialogNode = (
    <>
      {tokenVisible && (
        <SandboxTokenIssueModal instance={instance} onCancel={() => setTokenVisible(false)} />
      )}
      {portVisible && (
        <SandboxPortOpenModal
          instance={instance}
          onCancel={() => setPortVisible(false)}
          onSuccess={onChanged}
        />
      )}
    </>
  );
  const openPort = () => setPortVisible(true);
  const openToken = () => setTokenVisible(true);
  const portDisabled = !running || !portsAvailable;
  const tokenDisabled = !running || !tokenAvailable;

  return (
    <>
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <Typography.Title heading={6}>预览端口</Typography.Title>
          <Space>
            <Button size="small" disabled={portDisabled} onClick={openPort}>
              打开预览
            </Button>
          </Space>
        </div>
        <DataTable<SandboxPortSummary>
          data={sandbox.ports ?? []}
          rowKey={(item) => String(item.port)}
          pagination={false}
          noDataElement={<Empty description="暂无预览端口" />}
          rowActions={actions}
          columns={[
            {
              title: "端口",
              width: 100,
              render: (_, item) => `:${item.port}`,
            },
            // { title: "名称", dataIndex: "name", placeholder: "-" },
            {
              title: "协议",
              width: 100,
              dataIndex: "protocol",
              placeholder: "tcp",
            },
            {
              title: "状态",
              width: 120,
              render: (_, item) => <StatusBadge status={item.status} />,
            },
            {
              title: "预览地址",
              ellipsis: true,
              width: 200,
              render: (_, item) =>
                item.preview_url ? (
                  <a
                    href={item.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[rgb(var(--link-6))]"
                  >
                    {item.preview_url}
                  </a>
                ) : (
                  "-"
                ),
            },
          ]}
        />
      </section>

      <Space direction="vertical" size={24} className="w-full">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography.Title heading={6}>短期连接令牌</Typography.Title>
            <Button size="small" disabled={tokenDisabled} onClick={openToken}>
              签发令牌
            </Button>
          </div>
          <Typography.Text type="secondary">
            在弹窗中配置有效期与授权范围；签发结果仅显示一次。
          </Typography.Text>
        </section>
      </Space>

      {dialogNode}
    </>
  );
}

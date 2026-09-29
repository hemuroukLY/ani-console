import { Table } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import { ResourcePageFrame, StatusBadge, type StatusBadgeTone } from "@/components/common";
import styles from "./index.module.css";

interface StatusSample {
  key: string;
  label: string;
  tone: StatusBadgeTone;
  loading?: boolean;
  description: string;
  usage: string;
}

const STATUS_SAMPLES: StatusSample[] = [
  {
    key: "running",
    label: "运行中",
    tone: "primary",
    description: "资源正在正常运行或持续提供服务",
    usage: '<StatusBadge tone="primary">运行中</StatusBadge>',
  },
  {
    key: "stopped",
    label: "已停止",
    tone: "danger",
    description: "资源已停止，当前不可用",
    usage: '<StatusBadge tone="danger">已停止</StatusBadge>',
  },
  {
    key: "enabling",
    label: "启用中",
    tone: "primary",
    loading: true,
    description: "资源正在执行启用、创建或部署等异步操作",
    usage: '<StatusBadge tone="primary" loading>启用中</StatusBadge>',
  },
  {
    key: "deleted",
    label: "已删除",
    tone: "neutral",
    description: "资源已删除、已失效或不再参与当前流程",
    usage: '<StatusBadge tone="neutral">已删除</StatusBadge>',
  },
  {
    key: "paused",
    label: "已暂停",
    tone: "warning",
    description: "资源仍然存在，但需要关注或暂时停止处理",
    usage: '<StatusBadge tone="warning">已暂停</StatusBadge>',
  },
];

const COLUMNS: TableColumnProps<StatusSample>[] = [
  {
    title: "指示器",
    width: 160,
    render: (_, sample) => (
      <StatusBadge tone={sample.tone} loading={sample.loading}>
        {sample.label}
      </StatusBadge>
    ),
  },
  {
    title: "推荐语义",
    dataIndex: "description",
  },
  {
    title: "调用示例",
    width: 500,
    render: (_, sample) => <code className={styles.code}>{sample.usage}</code>,
  },
];

export function ResourcePage() {
  return (
    <ResourcePageFrame
      header={{
        iconClassName: "icon-biaoqianguanli",
        title: "组件示例",
        subtitle: "本地开发示例页，用于测试组件样式、交互与使用方式",
      }}
    >
      <section className={styles.panel}>
        <Table<StatusSample>
          rowKey="key"
          columns={COLUMNS}
          data={STATUS_SAMPLES}
          pagination={false}
          border={false}
          className={styles.table}
        />
      </section>
    </ResourcePageFrame>
  );
}

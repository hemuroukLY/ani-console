import { Divider, Modal, Typography } from "@arco-design/web-react";
import brandLogo from "@/assets/brand/logo.png";

interface AboutUsModalProps {
  onCancel: () => void;
}

export function AboutUsModal({ onCancel }: AboutUsModalProps) {
  return (
    <Modal
      title="关于我们"
      visible
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography.Text type="secondary">常青云多元算力产品团队</Typography.Text>
          <Typography.Text type="secondary">© 2026 常青云</Typography.Text>
        </div>
      }
      onCancel={onCancel}
      style={{ width: 700, maxWidth: "calc(100vw - 32px)" }}
    >
      <div className="py-2" style={{ color: "var(--color-text-2)", lineHeight: 1.9 }}>
        <div className="mb-8 flex items-center gap-5 py-3">
          <img src={brandLogo} alt="常青云" className="h-14 w-14 shrink-0 object-contain" />
          <div className="min-w-0">
            <Typography.Title heading={5} style={{ margin: "0 0 4px" }}>
              常青云 AI专有云
            </Typography.Title>
            <Typography.Text type="secondary">KuberCloud AI-Native Infrastructure</Typography.Text>
          </div>
        </div>

        <p
          className="m-0 rounded-lg px-5 py-4"
          style={{ background: "var(--color-primary-light-1)" }}
        >
          KuberCloud ANI（AI 专有云）是常青云面向 AI
          时代构建的企业级专属算力云平台，以独立资源池、物理隔离与全栈专属的形式，部署在客户自己的环境中。
        </p>
        <p className="mt-5 mb-0">
          平台以原生 Kubernetes 为底座，将 GPU、NPU 等异构算力与
          CPU、虚拟机、裸金属等通用资源统一调度，向上提供模型仓库、推理服务、知识库、AI Agent
          安全沙箱等云服务与 AI 应用编排能力。
        </p>

        <Divider>
          <span
            className="inline-block rounded-full border border-solid px-5 py-1 text-sm font-medium tracking-widest"
            style={{
              background: "var(--color-primary-light-1)",
              borderColor: "var(--color-primary-light-3)",
              color: "rgb(var(--primary-6))",
            }}
          >
            同源共生 · 全态承载
          </span>
        </Divider>

        <p className="m-0">
          产品坚持「同源共生，全态承载」的架构设计：传统业务应用、AI 增强型应用与 AI
          原生应用共用同一套算力底座，无需推翻既有系统，可按自身节奏引入 AI
          能力。数据留在客户侧，安全与合规边界清晰，同时保有公有云级别的弹性与运营效率。
        </p>
      </div>
    </Modal>
  );
}

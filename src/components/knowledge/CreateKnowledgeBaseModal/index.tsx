import { Form, Input, InputNumber, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createKnowledgeBase,
  type CreateKnowledgeBaseInput,
  type KnowledgeBase,
} from "@/api/knowledge";
import { KnowledgeModelSelect } from "@/components/knowledge/KnowledgeModelSelect";
import { validateForm } from "@/lib/form";

type CreateKnowledgeBaseFormValues = CreateKnowledgeBaseInput & {
  embedding_model?: string;
  chunk_size: number;
  top_k: number;
};

export function CreateKnowledgeBaseModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated?: (item: KnowledgeBase) => void;
}) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建知识库",
        successText: "知识库已创建",
        errorFallback: "创建知识库失败",
      },
    },
    mutationFn: async (values: {
      name: string;
      description?: string;
      embedding_model?: string;
      default_inference_service?: string;
      chunk_size: number;
      top_k: number;
    }) => {
      const submitData = {
        ...values,
        name: values.name.trim(),
        embedding_model: values.embedding_model || undefined,
        description: values.description?.trim() || undefined,
        default_inference_service: values.default_inference_service || undefined,
      };
      return createKnowledgeBase(submitData);
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ["knowledge-bases"] });
      form.resetFields();
      onCancel();
      onCreated?.(item);
    },
  });
  return (
    <Modal
      title="创建知识库"
      visible
      confirmLoading={create.isPending}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() =>
        validateForm<CreateKnowledgeBaseFormValues>(form).then((values) => create.mutate(values))
      }
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          chunk_size: 1024,
          top_k: 5,
        }}
      >
        <Form.Item
          label="名称"
          field="name"
          rules={[{ required: true, message: "请输入知识库名称" }, { maxLength: 128 }]}
        >
          <Input placeholder="例如：产品资料库" />
        </Form.Item>
        <Form.Item label="描述" field="description">
          <Input.TextArea placeholder="说明知识库的内容和用途" maxLength={500} showWordLimit />
        </Form.Item>
        <Form.Item
          label="向量化模型"
          field="embedding_model"
          extra="使用默认模型时由服务端配置决定实际模型。若创建或向量化失败，请管理员检查默认 embedding 配置与推理服务路由，然后重试；当前表单会保留。"
        >
          <KnowledgeModelSelect capability="embedding" />
        </Form.Item>
        <Form.Item
          label="默认推理模型"
          field="default_inference_service"
          extra="可选；未指定时使用服务端默认模型。"
        >
          <KnowledgeModelSelect capability="text-generation" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="分块大小" field="chunk_size" rules={[{ required: true }]}>
            <InputNumber min={1} max={8192} className="w-full" />
          </Form.Item>
          <Form.Item label="默认 TopK" field="top_k" rules={[{ required: true }]}>
            <InputNumber min={1} max={20} className="w-full" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

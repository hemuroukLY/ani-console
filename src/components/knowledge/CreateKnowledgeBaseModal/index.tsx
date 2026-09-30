import { Form, Input, InputNumber, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import {
  createKnowledgeBase,
  type CreateKnowledgeBaseInput,
  type KnowledgeBase,
} from "@/api/knowledge";
import { KnowledgeModelSelect } from "@/components/knowledge/KnowledgeModelSelect";
import { validateForm } from "@/lib/form";

type CreateKnowledgeBaseFormValues = CreateKnowledgeBaseInput & {
  embedding_model: string;
  default_inference_service: string;
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
    mutationFn: async (values: CreateKnowledgeBaseFormValues) => {
      const submitData = {
        ...values,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
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
  const modelExtra = (
    <>
      用于知识库问答生成回答。
      <Link to="/inference" target="_blank" rel="noopener noreferrer">
        打开推理服务
      </Link>
    </>
  );

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
          rules={[{ required: true, message: "请选择向量化模型" }]}
          extra={
            <>
              用于文档向量化和检索。
              <Link to="/inference" target="_blank" rel="noopener noreferrer">
                管理模型
              </Link>
            </>
          }
        >
          <KnowledgeModelSelect capability="embedding" required />
        </Form.Item>
        <Form.Item
          label="推理模型"
          field="default_inference_service"
          rules={[{ required: true, message: "请选择推理模型" }]}
          extra={modelExtra}
        >
          <KnowledgeModelSelect capability="text-generation" required />
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

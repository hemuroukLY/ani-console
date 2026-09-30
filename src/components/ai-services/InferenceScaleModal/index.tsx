import { updateInferenceService } from "@/api/ai-services/inference";
import { Form, InputNumber, Modal, Typography } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validateForm } from "@/lib/form";

export function InferenceScaleModal({
  serviceId,
  initialReplicas,
  onCancel,
}: {
  serviceId: string;
  initialReplicas: number;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const [form] = Form.useForm<{ replicas: number }>();
  const scale = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "调整副本",
        successText: "副本调整已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (replicas: number) => updateInferenceService(serviceId, { replicas }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inference-service", serviceId] });
      void qc.invalidateQueries({ queryKey: ["inference-services"] });
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="调整副本数"
      onCancel={onCancel}
      confirmLoading={scale.isPending}
      onOk={async () => {
        const values = await validateForm<{ replicas: number }>(form);
        await scale.mutateAsync(values.replicas);
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ replicas: initialReplicas }}>
        <Form.Item
          field="replicas"
          label="期望副本数"
          rules={[{ required: true, type: "number", min: 1, message: "请输入大于等于 1 的副本数" }]}
        >
          <InputNumber min={1} precision={0} className="w-full" />
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">
        调整请求将异步执行，可在详情栏的“当前操作”中查看进度。
      </Typography.Text>
    </Modal>
  );
}

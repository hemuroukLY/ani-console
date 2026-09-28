import { Tooltip } from "@arco-design/web-react";
import type { InferenceService } from "@/api/ai-services/inference";
import { StatusTag } from "@/components/common";

type InferenceStatusTagProps = Pick<
  InferenceService,
  "status" | "status_reason" | "status_message"
>;

export function InferenceStatusTag({
  status,
  status_reason,
  status_message,
}: InferenceStatusTagProps) {
  const reason = status_reason?.trim();
  const message = status_message?.trim();
  const tag = <StatusTag status={status} />;

  if (status !== "failed" || (!reason && !message)) return tag;

  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-1 wrap-anywhere whitespace-pre-wrap">
          {reason && <div className="font-semibold">{reason}</div>}
          {message && <div>{message}</div>}
        </div>
      }
    >
      <span className="inline-flex">{tag}</span>
    </Tooltip>
  );
}

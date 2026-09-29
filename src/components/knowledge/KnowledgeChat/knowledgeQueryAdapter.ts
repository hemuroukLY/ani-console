import type { ChatModelAdapter, ThreadMessage, ThreadMessageLike } from "@assistant-ui/react";
import {
  queryKnowledgeBase,
  streamKnowledgeBaseQuery,
  type KBQueryResponse as Answer,
  type KBSessionMessage as SessionMessage,
} from "@/api/knowledge";
import { parseDateTime } from "@/lib/date";

export type QueryMode = "sync" | "stream";

function getLatestQuestion(messages: readonly ThreadMessage[]) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  return (
    latestUserMessage?.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

export function toThreadMessage(message: SessionMessage): ThreadMessageLike {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    metadata: {
      custom: { sources: message.role === "assistant" ? (message.sources ?? []) : [] },
    },
    createdAt: parseDateTime(message.created_at),
  };
}

function parseSseBlock(block: string) {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  return { event, data: data.join("\n") };
}

export function createKnowledgeBaseAdapter(
  kbId: string,
  sessionIdRef: { current?: string },
  mode: QueryMode,
  topK: number,
  inferenceServiceName: string | undefined,
  onComplete: (sessionId?: string) => void,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const question = getLatestQuestion(messages);
      if (!question) throw new Error("请输入问题");
      if (mode === "stream") {
        const stream = await streamKnowledgeBaseQuery(
          kbId,
          {
            question,
            top_k: topK,
            session_id: sessionIdRef.current,
            inference_service_name: inferenceServiceName,
          },
          abortSignal,
        );
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";
        let sources: Answer["sources"] = [];
        let completedSessionId = sessionIdRef.current;
        try {
          while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value, { stream: !done });
            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() ?? "";
            if (done && buffer.trim()) blocks.push(buffer);
            if (done) buffer = "";
            for (const block of blocks) {
              const event = parseSseBlock(block);
              if (!event.data) continue;
              const payload = JSON.parse(event.data) as Record<string, unknown>;
              if (event.event === "token") {
                text += typeof payload.delta === "string" ? payload.delta : "";
              } else if (event.event === "sources") {
                sources = Array.isArray(payload) ? (payload as Answer["sources"]) : [];
              } else if (event.event === "done") {
                if (typeof payload.session_id === "string") {
                  sessionIdRef.current = payload.session_id;
                  completedSessionId = payload.session_id;
                }
              } else if (event.event === "error") {
                throw new Error(
                  typeof payload.message === "string" ? payload.message : "流式问答失败",
                );
              }
              yield {
                content: [{ type: "text", text }],
                metadata: { custom: { sources } },
              };
            }
            if (done) break;
          }
        } finally {
          reader.releaseLock();
        }
        onComplete(completedSessionId);
        return;
      }

      const submitData = {
        question,
        session_id: sessionIdRef.current,
        top_k: topK,
        inference_service_name: inferenceServiceName,
      };
      const data = await queryKnowledgeBase(kbId, submitData);
      sessionIdRef.current = data.session_id;
      onComplete(data.session_id);
      yield {
        content: [{ type: "text", text: data.answer }],
        metadata: { custom: { sources: data.sources } },
      };
    },
  };
}

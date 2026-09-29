import type { KBSourceChunk } from "@/api/knowledge";
import { Drawer, Tag, Typography } from "@arco-design/web-react";

export function KnowledgeSourcesDrawer({
  title,
  sources,
  onCancel,
}: {
  title: string;
  sources: { source: KBSourceChunk; index: number }[];
  onCancel: () => void;
}) {
  return (
    <Drawer
      visible
      width={880}
      style={{ maxWidth: "100vw" }}
      title={
        <span className="[overflow-wrap:anywhere]">
          {title} · {sources.length} 个引用分段
        </span>
      }
      footer={null}
      onCancel={onCancel}
      escToExit
    >
      <div aria-label={`${title}的引用分段`} className="flex flex-col gap-4">
        {sources.map(({ source, index }) => (
          <article
            key={index}
            className="rounded-lg border border-solid border-(--color-neutral-3) bg-(--color-bg-2) p-4"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Tag size="small">引用 {index + 1}</Tag>
              <Typography.Text type="secondary">
                {source.page != null ? `第 ${source.page} 页 · ` : ""}
                {(source.content?.length ?? 0).toLocaleString("zh-CN")} 字符
                {source.score != null ? ` · 匹配度 ${source.score.toFixed(3)}` : ""}
              </Typography.Text>
            </div>
            <Typography.Paragraph className="mb-0! whitespace-pre-wrap leading-7 [overflow-wrap:anywhere]">
              {source.content || "-"}
            </Typography.Paragraph>
          </article>
        ))}
      </div>
    </Drawer>
  );
}

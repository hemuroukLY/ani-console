import type { KBSourceChunk } from "@/api/knowledge";
import { useAuiState } from "@assistant-ui/react";
import { Button, Divider } from "@arco-design/web-react";
import { IconFile } from "@arco-design/web-react/icon";
import { useState } from "react";
import { KnowledgeSourcesDrawer } from "./KnowledgeSourcesDrawer";

interface SourceGroup {
  key: string;
  title: string;
  sources: { source: KBSourceChunk; index: number }[];
}

function groupSources(sources: readonly KBSourceChunk[]) {
  const groups = new Map<string, SourceGroup>();
  sources.forEach((source, index) => {
    // Missing document IDs must not merge unrelated sources with the same filename.
    const key = source.doc_id ? `doc:${source.doc_id}` : `source:${index}`;
    const existing = groups.get(key);
    if (existing) {
      existing.sources.push({ source, index });
      if (source.file_name) existing.title = source.file_name;
    } else {
      groups.set(key, {
        key,
        title: source.file_name || source.doc_id || `来源 ${index + 1}`,
        sources: [{ source, index }],
      });
    }
  });
  return [...groups.values()];
}

export function KnowledgeSources() {
  const sources = useAuiState(
    (state) => state.message.metadata.custom.sources as readonly KBSourceChunk[] | undefined,
  );
  const [expanded, setExpanded] = useState(false);
  const [activeKey, setActiveKey] = useState<string>();
  const groups = groupSources(sources ?? []);
  const activeGroup = groups.find((group) => group.key === activeKey);
  if (!groups.length) return null;

  return (
    <div aria-label="引用来源" className="mt-4 flex flex-wrap items-center gap-2">
      <Divider style={{ margin: "0 0 4px" }} />
      {(expanded ? groups : groups.slice(0, 2)).map((group) => (
        <Button
          key={group.key}
          size="small"
          onClick={() => setActiveKey(group.key)}
          style={{ maxWidth: "min(260px, 100%)" }}
          title={group.title}
          aria-label={`查看引用来源：${group.title}`}
          aria-expanded={activeKey === group.key}
        >
          <span
            className="items-center gap-1.5 align-middle"
            style={{ display: "inline-flex", maxWidth: "100%", minWidth: 0 }}
          >
            <IconFile className="shrink-0" />
            <span className="min-w-0 max-w-[180px] truncate">{group.title}</span>
            <span className="shrink-0 text-(--color-text-3)">{group.sources.length}</span>
          </span>
        </Button>
      ))}
      {groups.length > 2 ? (
        <Button
          size="small"
          type="text"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? "收起" : `+${groups.length - 2}`}
        </Button>
      ) : null}
      {activeGroup ? (
        <KnowledgeSourcesDrawer
          title={activeGroup.title}
          sources={activeGroup.sources}
          onCancel={() => setActiveKey(undefined)}
        />
      ) : null}
    </div>
  );
}

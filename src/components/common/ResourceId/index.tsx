import { Button } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import clsx from "clsx";
import { copyToClipboard } from "@/lib/clipboard";

export function ResourceId({
  value,
  className,
  copyable = true,
}: {
  value: string;
  className?: string;
  copyable?: boolean;
}) {
  return (
    <span className={clsx("inline-flex max-w-full min-w-0 items-center gap-1", className)}>
      <span className="min-w-0 truncate font-mono" title={value}>
        {value}
      </span>
      {copyable && (
        <Button
          title="复制资源 ID"
          className="shrink-0"
          type="text"
          size="mini"
          icon={<IconCopy />}
          aria-label="复制资源 ID"
          onClick={() => void copyToClipboard(value, "资源 ID")}
        />
      )}
    </span>
  );
}

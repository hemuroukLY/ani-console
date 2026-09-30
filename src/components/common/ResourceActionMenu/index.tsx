import { Button, Dropdown, Menu, Tooltip } from "@arco-design/web-react";
import { IconMoreVertical } from "@arco-design/web-react/icon";
import type { RowAction } from "@/components/common/DataTable/types";

export function ResourceActionMenu<T>({ record, actions }: { record: T; actions: RowAction<T>[] }) {
  const visible = actions.filter((action) => action.visible?.(record) !== false);
  return (
    <Dropdown
      trigger="click"
      position="br"
      droplist={
        <Menu>
          {visible.map((action) => {
            const pending = action.loading?.(record) ?? false;
            const tooltip =
              typeof action.tooltip === "function" ? action.tooltip(record) : action.tooltip;
            const label = typeof action.label === "function" ? action.label(record) : action.label;
            return (
              <Menu.Item
                key={action.key}
                disabled={pending || action.disabled?.(record)}
                style={action.intent === "danger" ? { color: "var(--color-danger-6)" } : undefined}
                onClick={() => {
                  void Promise.resolve(action.onClick(record)).catch(() => undefined);
                }}
              >
                {tooltip ? (
                  <Tooltip content={tooltip}>
                    <span>{label}</span>
                  </Tooltip>
                ) : (
                  label
                )}
              </Menu.Item>
            );
          })}
        </Menu>
      }
    >
      <Button aria-label="更多操作" title="更多操作">
        <IconMoreVertical />
      </Button>
    </Dropdown>
  );
}

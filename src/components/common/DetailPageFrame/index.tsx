import { Button, Tooltip } from "@arco-design/web-react";
import clsx from "clsx";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AliIcon } from "../AliIcon";
import { DetailBreadcrumbs } from "./DetailBreadcrumbs";
import { DetailContentTabs } from "./DetailContentTabs";
import { DetailInfoSidebar } from "./DetailInfoSidebar";
import { DetailPageHeader } from "./DetailPageHeader";
import styles from "./index.module.css";
import type { DetailBreadcrumbItem, DetailCard, DetailHeaderItems, DetailTab } from "./types";

type DetailPageFrameProps<TKey extends string> = {
  breadcrumbs: DetailBreadcrumbItem[];
  title: ReactNode;
  status?: ReactNode;
  icon?: ReactNode;
  headerItems: DetailHeaderItems;
  actions?: ReactNode;
  cards: DetailCard[];
  onBack?: () => void;
  leftWidth?: number;
} & (
  | { tabs: DetailTab<TKey>[]; activeTabKey?: TKey; onTabChange?: (key: TKey) => void }
  | { tabs?: undefined; activeTabKey?: never; onTabChange?: never }
);

export function DetailPageFrame<TKey extends string>({
  breadcrumbs,
  title,
  status,
  icon,
  headerItems,
  actions,
  cards,
  tabs,
  onBack,
  leftWidth = 320,
  activeTabKey,
  onTabChange,
}: DetailPageFrameProps<TKey>) {
  // 缺失或无效的选中项统一回退到首个 Tab，不保存第二份选中状态。
  const activeTab = tabs?.find((tab) => tab.key === activeTabKey) ?? tabs?.[0];
  const hasTabs = Boolean(activeTab);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const workspaceStyle = { ["--detail-left-width" as string]: `${leftWidth}px` } as CSSProperties;

  return (
    <div className={styles.page}>
      <DetailBreadcrumbs items={breadcrumbs} onBack={onBack} />
      <DetailPageHeader
        title={title}
        status={status}
        icon={icon}
        items={headerItems}
        actions={actions}
      />

      <div
        className={clsx(
          styles.workspace,
          hasTabs ? styles.workspaceSplit : styles.workspaceSingle,
          leftCollapsed && styles.workspaceCollapsed,
        )}
        style={workspaceStyle}
      >
        <DetailInfoSidebar cards={cards} collapsed={leftCollapsed} />

        {hasTabs ? (
          <Tooltip content={leftCollapsed ? "展开详情栏" : "收起详情栏"}>
            <Button
              type="text"
              shape="circle"
              className={styles.paneToggle}
              aria-label={leftCollapsed ? "展开详情栏" : "收起详情栏"}
              onClick={() => setLeftCollapsed((current) => !current)}
            >
              <AliIcon name="left-chevron" size={16} className={styles.paneToggleIcon} />
            </Button>
          </Tooltip>
        ) : null}

        {activeTab ? (
          <DetailContentTabs
            tabs={tabs ?? []}
            activeTabKey={activeTab.key}
            onTabChange={onTabChange}
          />
        ) : null}
      </div>
    </div>
  );
}

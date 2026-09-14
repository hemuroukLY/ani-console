import { Empty, Spin } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { SummaryOverview } from "./SummaryOverview";
import { TasksPanel } from "./TasksPanel";
import { TrendCard } from "./TrendCard";
import { WelcomePanel } from "./WelcomePanel";
import { homeOverviewDataSource } from "./data-source";
import type { HomeOverviewDataSource } from "./types";
import styles from "./index.module.css";
import { useListErrorNotification } from "@/hooks/useListErrorNotification";

export function OverviewPage({
  dataSource = homeOverviewDataSource,
}: {
  dataSource?: HomeOverviewDataSource;
}) {
  const query = useQuery({
    queryKey: ["home-overview"],
    queryFn: () => dataSource.getOverview(),
  });
  useListErrorNotification({
    id: "home-overview",
    title: "首页数据加载失败",
    error: query.error,
  });

  if (query.isLoading) {
    return (
      <div className={styles.pageState} role="status">
        <Spin size={32} />
        <span>正在加载首页数据...</span>
      </div>
    );
  }

  if (!query.data)
    return (
      <main className={styles.homePage}>
        <Empty description="暂无首页数据" />
      </main>
    );

  const data = query.data;
  return (
    <main className={styles.homePage} data-testid="home-overview-page">
      <div className={styles.twoColumnRow} data-testid="home-top-row">
        <SummaryOverview items={data.summaries} />
        <WelcomePanel
          user={data.user}
          quickCreateItems={data.quickCreateItems}
          recentItems={data.recentItems}
        />
      </div>

      <div className={styles.twoColumnRow} data-testid="home-middle-row">
        <TrendCard data={data.primaryTrend} dataSource={dataSource} metric="gpu" testId="gpu" />
        <TrendCard data={data.percentageTrend} dataSource={dataSource} metric="cpu" testId="cpu" />
      </div>

      <div className={styles.bottomGrid} data-testid="home-bottom-grid">
        <TrendCard
          data={data.comparisonTrend}
          dataSource={dataSource}
          metric="memory"
          testId="memory"
        />
        <TasksPanel items={data.tasks} />
      </div>
    </main>
  );
}

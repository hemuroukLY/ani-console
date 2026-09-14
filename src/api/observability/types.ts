import type { CoreDevProfileInfo } from "@/api/types";

export type ResourceTrendMetric = "gpu" | "cpu" | "memory";

export interface ObservabilityRangeQueryResponse {
  query: string;
  result_type: "vector" | "matrix" | "scalar" | "string";
  results: Array<{
    metric: Record<string, string>;
    values: Array<{ timestamp: string; value: number }>;
  }>;
  dev_profile: CoreDevProfileInfo;
}

export interface ObservabilityRangeQueryParams {
  start: string;
  end: string;
  step: string;
}

export interface ResourceTrendQueryParams extends ObservabilityRangeQueryParams {
  metric: ResourceTrendMetric;
}

import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import type { ResourceDetailType } from "@/lib/resources";

const resourceListRoutes = {
  model: "/models",
  "inference-service": "/inference",
  "vm-instance": "/vm-instances",
  "container-instance": "/container-instances",
  "gpu-instance": "/gpu-instances",
  "sandbox-instance": "/sandbox-instances",
  "k8s-cluster": "/k8s-clusters",
  "knowledge-base": "/kb",
  vpc: "/vpcs",
  subnet: "/subnets",
  "security-group": "/security-groups",
  "network-route": "/routes",
  "load-balancer": "/load-balancers",
  volume: "/volumes",
  filesystem: "/filesystems",
  bucket: "/objects",
  "vector-store": "/vector-stores",
} as const satisfies Record<ResourceDetailType, string>;

export function useBackOrFallback(
  ...[resourceType, bucketId]:
    | [resourceType: ResourceDetailType]
    | [resourceType: "object", bucketId: string]
) {
  const router = useRouter();

  return useCallback(() => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    if (resourceType === "object") {
      void router.navigate({ to: "/objects/$bucketId", params: { bucketId }, replace: true });
      return;
    }
    void router.navigate({ to: resourceListRoutes[resourceType], replace: true });
  }, [router, resourceType, bucketId]);
}

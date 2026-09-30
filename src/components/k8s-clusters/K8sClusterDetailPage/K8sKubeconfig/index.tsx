import { useKubeconfigDownload } from "@/hooks/useKubeconfigDownload";

import { Button } from "@arco-design/web-react";

export function K8sKubeconfig({ clusterId }: { clusterId: string }) {
  const download = useKubeconfigDownload();

  return (
    <Button type="primary" loading={download.isPending} onClick={() => download.mutate(clusterId)}>
      下载 Kubeconfig
    </Button>
  );
}

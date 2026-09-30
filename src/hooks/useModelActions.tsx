import { useResourceDelete } from "@/hooks/useResourceDelete";
import { useState } from "react";
import { CreateInferenceServiceModal } from "@/components/ai-services/CreateInferenceServiceModal";
import { getLatestModelVersion, type Model } from "@/lib/ai-models";
import type { RowAction } from "@/components/common";

export function useModelActions(onDeleted: (item: Model) => void) {
  const [deployModel, setDeployModel] = useState<Model | null>(null);
  const remove = useResourceDelete<Model>("model", onDeleted);
  const deploymentOptions = deployModel ? getModelDeploymentOptions(deployModel) : undefined;
  const actions: RowAction<Model>[] = [
    {
      key: "deploy",
      label: "部署",
      disabled: (item) => !getModelDeploymentOptions(item),
      onClick: setDeployModel,
    },
    {
      key: "favorite",
      label: "收藏",
      disabled: () => true,
      tooltip: "等待后端开放收藏状态与操作接口",
      onClick: () => undefined,
    },
    {
      key: "add-version",
      label: "新增版本",
      disabled: () => true,
      tooltip: "等待后端确认测试环境的版本文件上传接口",
      onClick: () => undefined,
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: remove.isDisabled,
      onClick: (item) => void remove.confirm(item),
    },
  ];
  const dialogNode = (
    <>
      {deploymentOptions && (
        <CreateInferenceServiceModal {...deploymentOptions} onCancel={() => setDeployModel(null)} />
      )}
    </>
  );
  return { actions, dialogNode };
}

function getModelDeploymentOptions(model: Model) {
  const latestVersion = getLatestModelVersion(model);
  if (model.status !== "ready" || !latestVersion) return undefined;
  return {
    initialModelId: model.id,
    initialModelVersionId: latestVersion.id,
    initialServiceName: ("infer-" + model.name).slice(0, 63),
  };
}

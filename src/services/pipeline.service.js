import * as pipelinesModel from "../models/pipelines.model.js";

import { inboxWithPipelineSet } from "./inbox.service.js";

export const searchPipelineIsdefault = async ({ user_id }) => {
  const searchPipeline = await pipelinesModel.searchPipelineIsdefault({
    user_id,
  });
  if (!searchPipeline)
    throw new Error("Not found pipeline is default by user id");
  return searchPipeline;
};

export const seachPipelineById = async ({ id }) => {
  const searchPipeline = await pipelinesModel.seachPipelineById({ id });

  if (!searchPipeline) throw new Error("Pipeline not found ");

  return searchPipeline;
};

export const getPipelinesWithProductsSet = async ({ id }) => {
  return await pipelinesModel.getPipelinesWithProductsSet({ id });
};

export const getPipelineByUserIdAndWithoutInboxSet = async ({ id }) => {
  const allPipelinesByUserId = await pipelinesModel.getPipelineByUserId({ id });

  let pipelineWithoutInboxSet = [];

  await Promise.all(
    allPipelinesByUserId.map(async (pipeline) => {
      const pipelineWithInboxSet = await inboxWithPipelineSet({
        pipeline_id: pipeline.id,
      });

      if (!pipelineWithInboxSet) {
        pipelineWithoutInboxSet.push(pipeline);
      }
    }),
  );

  return pipelineWithoutInboxSet;
};

import * as pipelinesModel from "../models/pipelines.model.js";

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

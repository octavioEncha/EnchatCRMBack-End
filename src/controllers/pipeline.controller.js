import * as pipelineService from "../services/pipeline.service.js";
export const getPipelineByUserIdAndWithoutInboxSet = async (req, res) => {
  try {
    const id = req.params.id;
    const pipelinesWithoutInboxSet =
      await pipelineService.getPipelineByUserIdAndWithoutInboxSet({ id });
    res.status(200).json({ pipelines: pipelinesWithoutInboxSet });
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the pipeline." });
  }
};

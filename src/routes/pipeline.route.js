import { Router } from "express";
import * as pipelineController from "../controllers/pipeline.controller.js";

const router = Router();

router.get(
  "/without-inbox/:id",
  pipelineController.getPipelineByUserIdAndWithoutInboxSet,
);

export default router;

import { Router } from "express";
import { getAllProjects, createProject, updateProject, deleteProject, updatePlanStatus } from "../controller/project.js";

const router = Router();

router.get("/", getAllProjects);
router.post("/", createProject);
router.put("/:id", updateProject);
router.put("/:id/plans/:planId/status", updatePlanStatus);
router.delete("/:id", deleteProject);

export default router;

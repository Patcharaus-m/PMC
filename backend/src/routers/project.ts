import { Router } from "express";
import { getAllProjects, createProject, updateProject } from "../controller/project.js";

const router = Router();

router.get("/", getAllProjects);
router.post("/", createProject);
router.put("/:id", updateProject);

export default router;

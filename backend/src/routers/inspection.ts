import { Router } from "express";
import {
  createInspection,
  getInspections,
  getInspectionById,
  getInspectionSummary,
  updateInspection,
  deleteInspection,
  seedInspections,
} from "../controller/inspection.js";

const router = Router();

// Seed & Summary routes first (before /:id to avoid conflicts)
router.post("/seed", seedInspections);
router.get("/summary", getInspectionSummary);

router.post("/", createInspection);
router.get("/", getInspections);
router.get("/:id", getInspectionById);
router.put("/:id", updateInspection);
router.delete("/:id", deleteInspection);

export default router;

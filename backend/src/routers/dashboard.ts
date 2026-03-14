import { Router } from "express";
import { getSummary, seedDashboardData } from "../controller/dashboard.js";

const router = Router();

router.get("/summary", getSummary);
router.post("/seed", seedDashboardData);

export default router;

import { Router } from "express";
import authRouter from "./auth.js";
import documentRouter from "./document.js";
import dashboardRouter from "./dashboard.js";
import inspectionRouter from "./inspection.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/documents", documentRouter);
router.use("/dashboard", dashboardRouter);
router.use("/inspections", inspectionRouter);

export default router;

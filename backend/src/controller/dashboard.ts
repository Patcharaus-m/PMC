import { Request, Response } from "express";
import DailyReport from "../model/DailyReport.js";
import Project from "../model/Project.js";
import DocumentModel from "../model/Document.js";

// GET /api/dashboard/summary
export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Calculate Actual Progress — average of all DailyReport.actualProgressValue
    const dailyReports = await DailyReport.find();
    let actualProgress = 0;
    if (dailyReports.length > 0) {
      const total = dailyReports.reduce((sum, r) => sum + r.actualProgressValue, 0);
      actualProgress = total / dailyReports.length;
    }

    // 2. Get Project data — only fetch if projectId is provided (no fallback)
    const projectId = req.query.projectId as string | undefined;
    const project = projectId
      ? await Project.findById(projectId)
      : null;
    const plannedProgress = project ? project.plannedProgress : 0;
    const workforceCount = project ? project.workforceCount : 0;
    const safetyScore = project ? project.safetyScore : 100;
    const incidentCount = project ? project.incidentCount : 0;

    // 3. Difference
    const difference = plannedProgress - actualProgress;

    // 4. Document Summary — count by status (filtered by projectId if provided)
    const docFilter: Record<string, unknown> = {};
    if (projectId) {
      docFilter.projectId = projectId;
    }
    const approvedCount = await DocumentModel.countDocuments({ ...docFilter, status: "Approved" });
    const pendingCount = await DocumentModel.countDocuments({ ...docFilter, status: "Pending" });
    const rejectedCount = await DocumentModel.countDocuments({ ...docFilter, status: "Rejected" });
    const reviewingCount = await DocumentModel.countDocuments({ ...docFilter, status: "Reviewing" });

    // 5. Document breakdown by type (RFA, RFI, VO)
    const docTypes = ["RFA", "RFI", "VO"] as const;
    const documentBreakdown: Record<string, { total: number; pending: number; approved: number }> = {};

    for (const docType of docTypes) {
      const totalCount = await DocumentModel.countDocuments({ ...docFilter, type: docType });
      const typePending = await DocumentModel.countDocuments({ ...docFilter, type: docType, status: { $in: ["Pending", "Reviewing"] } });
      const typeApproved = await DocumentModel.countDocuments({ ...docFilter, type: docType, status: "Approved" });
      documentBreakdown[docType] = {
        total: totalCount,
        pending: typePending,
        approved: typeApproved,
      };
    }

    // 6. Pending documents total (for KPI card)
    const pendingDocuments = pendingCount + reviewingCount;

    // 7. Last update time
    const lastReport = await DailyReport.findOne().sort({ updatedAt: -1 });
    const lastUpdateTime = lastReport ? lastReport.updatedAt : new Date();

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: {
        progress: {
          actualProgress: parseFloat(actualProgress.toFixed(2)),
          plannedProgress,
          difference: parseFloat(difference.toFixed(2)),
        },
        workforceCount,
        lastUpdateTime,
        pendingDocuments,
        safetyScore,
        incidentCount,
        documentBreakdown,
        plans: project?.plans ?? [],
        projectStartDate: project?.startDate ?? null,
        projectEndDate: project?.endDate ?? null,
        documentSummary: {
          ok: approvedCount,
          wait: pendingCount,
          no: rejectedCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: 0,
      error: (error as Error).message,
      payload: null,
    });
  }
};

// POST /api/dashboard/seed — Seed initial project + daily report data
export const seedDashboardData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const samplePlans = [
      {
        order: "1",
        planName: "งานฐานราก (Foundation)",
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-04-30"),
        note: "เสาเข็ม + ฐานราก",
        color: "#3b82f6",
      },
      {
        order: "2",
        planName: "งานโครงสร้าง (Structure)",
        startDate: new Date("2025-05-01"),
        endDate: new Date("2025-10-31"),
        note: "คอนกรีต + เหล็ก",
        color: "#ef4444",
      },
      {
        order: "3",
        planName: "งานสถาปัตยกรรม (Architecture)",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2026-03-31"),
        note: "ผนัง พื้น ฝ้า",
        color: "#f59e0b",
      },
      {
        order: "4",
        planName: "งานระบบไฟฟ้า-สื่อสาร (MEP-Electrical)",
        startDate: new Date("2025-11-01"),
        endDate: new Date("2026-06-30"),
        note: "ระบบไฟฟ้า + LAN + CCTV",
        color: "#10b981",
      },
      {
        order: "5",
        planName: "งานระบบประปา-สุขาภิบาล (MEP-Plumbing)",
        startDate: new Date("2025-11-01"),
        endDate: new Date("2026-05-31"),
        note: "ระบบน้ำ + สุขภัณฑ์",
        color: "#6366f1",
      },
      {
        order: "6",
        planName: "งานตกแต่ง + ส่งมอบ (Finishing)",
        startDate: new Date("2026-04-01"),
        endDate: new Date("2026-12-31"),
        note: "ตกแต่งภายใน + ทดสอบระบบ + ส่งมอบ",
        color: "#ec4899",
      },
    ];

    // If no projects exist at all, create a sample one
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.create({
        projectName: "โครงการก่อสร้างอาคารสำนักงานอัจฉริยะ (SMART OFFICE TOWER)",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2026-12-31"),
        plannedProgress: 70,
        workforceCount: 124,
        safetyScore: 100,
        incidentCount: 0,
        plans: samplePlans,
      });
    }

    // Update ALL projects that have empty plans with sample data
    const projectsWithoutPlans = await Project.find({
      $or: [
        { plans: { $exists: false } },
        { plans: { $size: 0 } },
      ],
    });

    for (const proj of projectsWithoutPlans) {
      proj.plans = samplePlans as any;
      await proj.save();
      console.log(`✅  [Seed] Added plans to project: ${proj.projectName}`);
    }

    // Seed daily reports if none exist
    const reportCount = await DailyReport.countDocuments();
    if (reportCount === 0) {
      await DailyReport.insertMany([
        { date: new Date("2026-03-10"), progressDetail: "Foundation work completed", actualProgressValue: 62 },
        { date: new Date("2026-03-11"), progressDetail: "Structural steel Phase 1", actualProgressValue: 64 },
        { date: new Date("2026-03-12"), progressDetail: "Structural steel Phase 2", actualProgressValue: 65 },
        { date: new Date("2026-03-13"), progressDetail: "MEP rough-in started", actualProgressValue: 66 },
        { date: new Date("2026-03-14"), progressDetail: "MEP rough-in progress", actualProgressValue: 68 },
      ]);
    }

    // Seed documents if none exist  
    const docCount = await DocumentModel.countDocuments();
    if (docCount === 0) {
      const rfaDocs = [];
      for (let i = 1; i <= 45; i++) {
        const status = i <= 38 ? "Approved" : i <= 43 ? "Pending" : "Reviewing";
        rfaDocs.push({
          documentNo: `RFA-2026-${String(i).padStart(3, "0")}`,
          type: "RFA",
          subject: `RFA Document #${i}`,
          status,
          pdfUrl: "",
          originatorName: "System Seed",
        });
      }

      const rfiDocs = [];
      for (let i = 1; i <= 28; i++) {
        const status = i <= 25 ? "Approved" : "Pending";
        rfiDocs.push({
          documentNo: `RFI-2026-${String(i).padStart(3, "0")}`,
          type: "RFI",
          subject: `RFI Document #${i}`,
          status,
          pdfUrl: "",
          originatorName: "System Seed",
        });
      }

      const voDocs = [];
      for (let i = 1; i <= 12; i++) {
        const status = i <= 6 ? "Approved" : i <= 10 ? "Pending" : "Reviewing";
        voDocs.push({
          documentNo: `VO-2026-${String(i).padStart(3, "0")}`,
          type: "VO",
          subject: `VO Document #${i}`,
          status,
          pdfUrl: "",
          originatorName: "System Seed",
        });
      }

      await DocumentModel.insertMany([...rfaDocs, ...rfiDocs, ...voDocs]);
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      message: "Dashboard data seeded successfully",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: 0,
      error: (error as Error).message,
      payload: null,
    });
  }
};

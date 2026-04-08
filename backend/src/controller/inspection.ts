import { Request, Response } from "express";
import Inspection from "../model/Inspection.js";

// POST /api/inspections
export const createInspection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, zone, assignee, date, status, punchListCount, projectId, beforeImage, afterImage } = req.body;
    const inspection = new Inspection({
      title, zone, assignee, date, status, punchListCount,
      projectId: projectId || undefined,
      beforeImage: beforeImage || "",
      afterImage: afterImage || "",
    });
    await inspection.save();

    res.status(201).json({
      code: 201,
      status: 1,
      error: null,
      payload: inspection,
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

// GET /api/inspections?zone=Zone A
export const getInspections = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.zone && req.query.zone !== "All Zones") {
      filter.zone = req.query.zone;
    }
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const inspections = await Inspection.find(filter).sort({ date: -1 });

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: inspections,
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

// GET /api/inspections/summary
export const getInspectionSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }
    const inspections = await Inspection.find(filter);
    const total = inspections.length;
    const completed = inspections.filter((i) => i.status === "COMPLETED").length;

    // Punch list: items that are NOT completed
    const pendingItems = inspections.filter((i) => i.status !== "COMPLETED");
    const totalPunchList = pendingItems.reduce((sum, i) => sum + (i.punchListCount || 0), 0);

    // Count items waiting for fix (REJECTED + items with punchListCount > 0)
    const waitingForFix = inspections.filter(
      (i) => i.status === "REJECTED" || (i.punchListCount > 0 && i.status !== "COMPLETED")
    ).length;

    const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: {
        totalInspections: total,
        completed,
        pending: inspections.filter((i) => i.status === "PENDING").length,
        inProgress: inspections.filter((i) => i.status === "IN PROGRESS").length,
        rejected: inspections.filter((i) => i.status === "REJECTED").length,
        totalPunchList,
        waitingForFix,
        resolutionRate,
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

// GET /api/inspections/:id
export const getInspectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Inspection not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: inspection,
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

// PUT /api/inspections/:id
export const updateInspection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, zone, assignee, date, status, punchListCount, beforeImage, afterImage } = req.body;
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (zone !== undefined) updateData.zone = zone;
    if (assignee !== undefined) updateData.assignee = assignee;
    if (date !== undefined) updateData.date = date;
    if (status !== undefined) updateData.status = status;
    if (punchListCount !== undefined) updateData.punchListCount = punchListCount;
    if (beforeImage !== undefined) updateData.beforeImage = beforeImage;
    if (afterImage !== undefined) updateData.afterImage = afterImage;
    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!inspection) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Inspection not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: inspection,
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

// DELETE /api/inspections/:id
export const deleteInspection = async (req: Request, res: Response): Promise<void> => {
  try {
    const inspection = await Inspection.findByIdAndDelete(req.params.id);
    if (!inspection) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Inspection not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: { message: "Inspection deleted successfully" },
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

// POST /api/inspections/seed
export const seedInspections = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.body?.projectId && req.body.projectId.length > 0 ? req.body.projectId : undefined;
    // Clear existing data for this project
    const delFilter: Record<string, unknown> = {};
    if (projectId) delFilter.projectId = projectId;
    await Inspection.deleteMany(delFilter);

    const seedData = [
      {
        title: "งานโครงสร้างชั้น 12 - Concrete Pouring",
        zone: "Zone A",
        assignee: "Somchai Y.",
        date: new Date("2024-05-18"),
        status: "COMPLETED",
        punchListCount: 0,
      },
      {
        title: "งานระบบไฟฟ้า - Conduit Installation",
        zone: "Zone B",
        assignee: "Wichai S.",
        date: new Date("2024-05-19"),
        status: "PENDING",
        punchListCount: 2,
      },
      {
        title: "งานสถาปัตยกรรม - ผนังเบาชั้น 10",
        zone: "Zone A",
        assignee: "Somchai Y.",
        date: new Date("2024-05-20"),
        status: "IN PROGRESS",
        punchListCount: 3,
      },
      {
        title: "งานประปา - Main Pipe Test",
        zone: "Zone C",
        assignee: "Anan K.",
        date: new Date("2024-05-20"),
        status: "REJECTED",
        punchListCount: 5,
      },
      {
        title: "งานฝ้าเพดาน - Hanging System",
        zone: "Zone B",
        assignee: "Wichai S.",
        date: new Date("2024-05-21"),
        status: "PENDING",
        punchListCount: 1,
      },
      {
        title: "งานพื้นกระเบื้อง - Tile Installation ชั้น 8",
        zone: "Zone A",
        assignee: "Somchai Y.",
        date: new Date("2024-05-21"),
        status: "IN PROGRESS",
        punchListCount: 2,
      },
      {
        title: "งานระบบดับเพลิง - Fire Sprinkler Test",
        zone: "Zone C",
        assignee: "Anan K.",
        date: new Date("2024-05-22"),
        status: "PENDING",
        punchListCount: 0,
      },
      {
        title: "งานลิฟต์ - Elevator Shaft Inspection",
        zone: "Zone B",
        assignee: "Wichai S.",
        date: new Date("2024-05-22"),
        status: "COMPLETED",
        punchListCount: 0,
      },
    ];

    await Inspection.insertMany(
      seedData.map((d) => ({ ...d, projectId: projectId || undefined }))
    );

    res.status(201).json({
      code: 201,
      status: 1,
      error: null,
      payload: { message: `Seeded ${seedData.length} inspection records` },
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

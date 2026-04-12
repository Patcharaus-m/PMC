import { Request, Response } from "express";
import Project from "../model/Project.js";

// GET /api/projects — List projects for a specific user
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    // Filter by userId query param (each user sees only their own projects)
    const { userId } = req.query;

    const filter: Record<string, unknown> = {};
    // Show: 1) user's own projects  2) old projects without an owner
    if (userId) {
      filter.$or = [
        { createdBy: userId },
        { createdBy: { $exists: false } },
        { createdBy: null },
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: projects,
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

// POST /api/projects — Create a new project (owned by a user)
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectName, startDate, endDate, plannedProgress, workforceCount, safetyScore, incidentCount, userId } = req.body;

    if (!projectName) {
      res.status(400).json({
        code: 400,
        status: 0,
        error: "projectName is required",
        payload: null,
      });
      return;
    }

    const project = await Project.create({
      projectName,
      ...(userId && { createdBy: userId }),
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      plannedProgress: plannedProgress ?? 0,
      workforceCount: workforceCount ?? 0,
      safetyScore: safetyScore ?? 100,
      incidentCount: incidentCount ?? 0,
    });

    res.status(201).json({
      code: 201,
      status: 1,
      error: null,
      payload: project,
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

// PUT /api/projects/:id — Update a project
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!project) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Project not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: project,
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

// DELETE /api/projects/:id — Delete a project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Project not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: { message: "Project deleted successfully" },
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

// PUT /api/projects/:id/plans/:planId/status — Update a plan's status & actualProgress
export const updatePlanStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, planId } = req.params;
    const { status, actualProgress } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Project not found",
        payload: null,
      });
      return;
    }

    const plan = (project.plans as any[]).find(
      (p: any) => p._id?.toString() === planId
    );
    if (!plan) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Plan not found",
        payload: null,
      });
      return;
    }

    if (status) plan.status = status;
    if (actualProgress !== undefined && actualProgress !== null) {
      plan.actualProgress = Math.max(0, Math.min(100, Number(actualProgress)));
    }

    // Auto-set actualProgress based on status convenience
    if (status === "completed") plan.actualProgress = 100;
    if (status === "not_started") plan.actualProgress = 0;

    await project.save();

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: project,
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

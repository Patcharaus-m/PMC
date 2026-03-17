import { Request, Response } from "express";
import Project from "../model/Project.js";

// GET /api/projects — List all projects
export const getAllProjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
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

// POST /api/projects — Create a new project
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectName, startDate, endDate, plannedProgress, workforceCount, safetyScore, incidentCount } = req.body;

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

import { Request, Response } from "express";
import DocumentModel from "../model/Document.js";

// POST /api/documents  (with multer upload)
export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentNo, type, subType, discipline, subject, originatorName, originatorId } = req.body;
    const pdfUrl = req.file ? req.file.path : undefined;

    const doc = new DocumentModel({
      documentNo,
      type,
      subType: type === "RFA" ? subType : undefined,
      discipline: type === "RFA" && (subType === "Material" || subType === "Shop Drawing") ? discipline : undefined,
      subject,
      status: "Pending",
      pdfUrl,
      originatorName,
      originatorId: originatorId || undefined,
    });

    await doc.save();

    res.status(201).json({
      code: 201,
      status: 1,
      error: null,
      payload: doc,
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

// GET /api/documents
export const getDocuments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const documents = await DocumentModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: documents,
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

// GET /api/documents/:id
export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const doc = await DocumentModel.findById(id);

    if (!doc) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Document not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: doc,
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

// PUT /api/documents/:id/status
export const updateDocumentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected", "Reviewing"].includes(status)) {
      res.status(400).json({
        code: 400,
        status: 0,
        error: "Invalid status. Must be Pending, Approved, Rejected, or Reviewing",
        payload: null,
      });
      return;
    }

    const doc = await DocumentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!doc) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Document not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: doc,
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

// DELETE /api/documents/:id
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const doc = await DocumentModel.findByIdAndDelete(id);

    if (!doc) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "Document not found",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: { message: "Document deleted successfully" },
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

// POST /api/documents/seed  — populate sample data
export const seedDocuments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await DocumentModel.countDocuments();
    if (count > 0) {
      res.status(200).json({
        code: 200,
        status: 1,
        error: null,
        payload: { message: "Data already seeded", count },
      });
      return;
    }

    const sampleDocs = [
      {
        documentNo: "NKC-STI-NDVO-GL-057-2568",
        type: "RFA",
        subType: "General",
        subject: "งานระบบปรับอากาศชั้น 5",
        status: "Approved",
        originatorName: "Site Eng. Somchai",
      },
      {
        documentNo: "NKC-STI-NDVO-MT-AC-012-2568",
        type: "RFA",
        subType: "Material",
        discipline: "AC",
        subject: "วัสดุท่อ Chilled Water System",
        status: "Pending",
        originatorName: "Foreman A",
      },
      {
        documentNo: "NKC-STI-NDVO-SD-AR-003-2568",
        type: "RFA",
        subType: "Shop Drawing",
        discipline: "AR",
        subject: "Shop Drawing งานสถาปัตยกรรมชั้น 3",
        status: "Reviewing",
        originatorName: "PM Wichit",
      },
      {
        documentNo: "NKC-STI-NDVO-MT-EE-042-2568",
        type: "RFA",
        subType: "Material",
        discipline: "EE",
        subject: "วัสดุ Electrical Panel Wing A",
        status: "Rejected",
        originatorName: "S. Eng. Wichai",
      },
      {
        documentNo: "NKC-STI-NDVO-SD-FP-085-2568",
        type: "RFA",
        subType: "Shop Drawing",
        discipline: "FP",
        subject: "Shop Drawing Fire Protection System",
        status: "Pending",
        originatorName: "Architect Team",
      },
      {
        documentNo: "RFI-2024-090",
        type: "RFI",
        subject: "Lighting Control Wiring Detail",
        status: "Approved",
        originatorName: "Contractor B",
      },
    ];

    await DocumentModel.insertMany(sampleDocs);

    res.status(201).json({
      code: 201,
      status: 1,
      error: null,
      payload: { message: "Sample data seeded successfully", count: sampleDocs.length },
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

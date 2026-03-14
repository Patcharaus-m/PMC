import { Router } from "express";
import upload from "../middleware/upload.js";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocumentStatus,
  deleteDocument,
  seedDocuments,
} from "../controller/document.js";

const router = Router();

router.post("/seed", seedDocuments);
router.post("/", upload.single("pdf"), createDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.put("/:id/status", updateDocumentStatus);
router.delete("/:id", deleteDocument);

export default router;

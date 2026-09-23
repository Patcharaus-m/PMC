import { Request, Response } from "express";
import DocumentModel from "../model/Document.js";

// POST /api/documents  (with multer upload)
export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentNo, type, subType, discipline, subject, originatorName, originatorId, projectId } = req.body;
    
    // ปรับให้ใช้ URL ของ Render ตรงๆ เลย
    let pdfUrl = undefined;
    if (req.file) {
      const baseUrl = "https://pmc-alwb.onrender.com"; 
      pdfUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

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
      projectId: projectId || undefined,
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
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }
    const documents = await DocumentModel.find(filter).sort({ createdAt: -1 });

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
    const { status, userRole } = req.body;

    // ตรวจสอบสิทธิ์: เฉพาะ Admin เท่านั้นที่เปลี่ยนสถานะได้
    if (userRole !== "Admin") {
      res.status(403).json({
        code: 403,
        status: 0,
        error: "เฉพาะ Admin เท่านั้นที่สามารถเปลี่ยนสถานะเอกสารได้",
        payload: null,
      });
      return;
    }

    if (!["Pending", "Approved", "Rejected", "Reviewing"].includes(status)) {
      res.status(400).json({
        code: 400,
        status: 0,
        error: "Invalid status. Must be Pending, Approved, Rejected, or Reviewing",
        payload: null,
      });
      return;
    }

    // Admin เปลี่ยนสถานะ → ตั้ง flag statusChangedByAdmin = true
    const doc = await DocumentModel.findByIdAndUpdate(
      id,
      { status, statusChangedByAdmin: true },
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
    const userRole = req.query.userRole || req.body?.userRole;

    // ตรวจสอบสิทธิ์: เฉพาะ Admin เท่านั้นที่ลบได้
    if (userRole !== "Admin") {
      res.status(403).json({
        code: 403,
        status: 0,
        error: "เฉพาะ Admin เท่านั้นที่สามารถลบเอกสารได้",
        payload: null,
      });
      return;
    }

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
export const seedDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.body?.projectId && req.body.projectId.length > 0 ? req.body.projectId : undefined;

    // 1. Drop stale unique index on documentNo (if exists from old schema)
    try {
      await DocumentModel.collection.dropIndex("documentNo_1");
    } catch {
      // Index doesn't exist — OK
    }

    // 2. Delete existing docs for this project (or all if no projectId)
    const delFilter: Record<string, unknown> = {};
    if (projectId) delFilter.projectId = projectId;
    await DocumentModel.deleteMany(delFilter);

    // 3. Insert sample documents — ครอบคลุมทุก type / subType / discipline / status
    const sampleDocs = [
      // ─── RFA · General (discipline = null) × 4 สถานะ ─────────────────────────────
      { documentNo: "RFA-2026-001", type: "RFA", subType: "General",                       subject: "ขออนุมัติแผนงานก่อสร้างอาคาร A ระยะที่ 1",                              status: "Pending",   originatorName: "สมชาย วิศวกรรม" },
      { documentNo: "RFA-2026-002", type: "RFA", subType: "General",                       subject: "ขออนุมัติแบบแปลนพื้นที่จอดรถใต้ดินชั้น B2",                             status: "Reviewing", originatorName: "วิชัย สถาปัตย์ดี" },
      { documentNo: "RFA-2026-003", type: "RFA", subType: "General",                       subject: "ขออนุมัติเปลี่ยนแปลงแนวทางระบายน้ำรอบอาคาร",                            status: "Approved",  originatorName: "ประเสริฐ แสงทอง" },
      { documentNo: "RFA-2026-004", type: "RFA", subType: "General",                       subject: "ขออนุมัติแผนจัดการจราจรชั่วคราวระหว่างก่อสร้าง",                         status: "Rejected",  originatorName: "ธนากร ศรีสุข" },

      // ─── RFA · Material × 8 Discipline ───────────────────────────────────────────
      { documentNo: "RFA-2026-005", type: "RFA", subType: "Material",   discipline: "AR",  subject: "ขออนุมัติวัสดุกระเบื้องพื้นห้องโถงชั้น 1 (Porcelain Tile 60x60)",       status: "Pending",   originatorName: "นภาพร ดีไซน์" },
      { documentNo: "RFA-2026-006", type: "RFA", subType: "Material",   discipline: "ST",  subject: "ขออนุมัติเหล็กเสริมคอนกรีต SD40 สำหรับเสาชั้น 8-12",                   status: "Reviewing", originatorName: "สุรศักดิ์ โครงสร้าง" },
      { documentNo: "RFA-2026-007", type: "RFA", subType: "Material",   discipline: "EE",  subject: "ขออนุมัติสายเคเบิลทองแดง NYY 3x95 sq.mm ระบบจ่ายไฟหลัก",              status: "Approved",  originatorName: "พิชัย ไฟฟ้าดี" },
      { documentNo: "RFA-2026-008", type: "RFA", subType: "Material",   discipline: "SN",  subject: "ขออนุมัติท่อ HDPE สำหรับระบบระบายน้ำเสียชั้นใต้ดิน",                   status: "Rejected",  originatorName: "อนันต์ ประปาศาสตร์" },
      { documentNo: "RFA-2026-009", type: "RFA", subType: "Material",   discipline: "AC",  subject: "ขออนุมัติเครื่องปรับอากาศ VRF ยี่ห้อ Daikin ขนาด 48,000 BTU",          status: "Pending",   originatorName: "กมล แอร์เย็น" },
      { documentNo: "RFA-2026-010", type: "RFA", subType: "Material",   discipline: "ME",  subject: "ขออนุมัติปั๊มน้ำดับเพลิง Fire Pump ขนาด 500 GPM",                       status: "Reviewing", originatorName: "วรพจน์ เครื่องกล" },
      { documentNo: "RFA-2026-011", type: "RFA", subType: "Material",   discipline: "FP",  subject: "ขออนุมัติหัวสปริงเกลอร์ดับเพลิงแบบ Pendant K-Factor 5.6",               status: "Approved",  originatorName: "ชาญชัย เซฟตี้" },
      { documentNo: "RFA-2026-012", type: "RFA", subType: "Material",   discipline: "ID",  subject: "ขออนุมัติวอลเปเปอร์ห้องประชุมใหญ่ชั้น 15 (Vinyl Wallpaper)",           status: "Rejected",  originatorName: "ปิยะ อินทีเรีย" },

      // ─── RFA · Shop Drawing × 8 Discipline ───────────────────────────────────────
      { documentNo: "RFA-2026-013", type: "RFA", subType: "Shop Drawing", discipline: "AR", subject: "Shop Drawing ผนังกระจก Curtain Wall อาคาร A ด้านทิศใต้",               status: "Approved",  originatorName: "นิติพงษ์ สถาปนิก" },
      { documentNo: "RFA-2026-014", type: "RFA", subType: "Shop Drawing", discipline: "ST", subject: "Shop Drawing โครงเหล็กหลังคา Steel Truss Span 24 เมตร",                 status: "Pending",   originatorName: "ภาณุพงศ์ โครงเหล็ก" },
      { documentNo: "RFA-2026-015", type: "RFA", subType: "Shop Drawing", discipline: "EE", subject: "Shop Drawing ตู้ MDB และ Single Line Diagram ระบบไฟฟ้าชั้น 1-5",       status: "Rejected",  originatorName: "เกียรติศักดิ์ อิเล็คทริค" },
      { documentNo: "RFA-2026-016", type: "RFA", subType: "Shop Drawing", discipline: "SN", subject: "Shop Drawing ระบบท่อน้ำประปาและสุขภัณฑ์ชั้น 6-10",                    status: "Reviewing", originatorName: "สมบูรณ์ วิศวะน้ำ" },
      { documentNo: "RFA-2026-017", type: "RFA", subType: "Shop Drawing", discipline: "AC", subject: "Shop Drawing แนวท่อลม Duct Layout ระบบ AHU ชั้น 3",                     status: "Approved",  originatorName: "ธีรพล แอร์ซิสเท็ม" },
      { documentNo: "RFA-2026-018", type: "RFA", subType: "Shop Drawing", discipline: "ME", subject: "Shop Drawing ระบบลิฟต์โดยสาร Passenger Elevator 3 ตัว",                 status: "Pending",   originatorName: "อภิชาติ เมคานิค" },
      { documentNo: "RFA-2026-019", type: "RFA", subType: "Shop Drawing", discipline: "FP", subject: "Shop Drawing ระบบท่อสปริงเกลอร์และ Fire Hose Cabinet ชั้น 1-15",       status: "Reviewing", originatorName: "สุทธิพงษ์ ไฟร์โปรเทค" },
      { documentNo: "RFA-2026-020", type: "RFA", subType: "Shop Drawing", discipline: "ID", subject: "Shop Drawing เคาน์เตอร์ต้อนรับและเฟอร์นิเจอร์ Built-in ล็อบบี้",         status: "Rejected",  originatorName: "จิราพร ดีไซน์สตูดิโอ" },

      // ─── RFI (subType/discipline = null) × 4 สถานะ ───────────────────────────────
      { documentNo: "RFI-2026-001", type: "RFI", subject: "ขอตรวจสอบงานเทคอนกรีตพื้นชั้น 7 (Slab Inspection)",               status: "Pending",   originatorName: "สมชาย วิศวกรรม" },
      { documentNo: "RFI-2026-002", type: "RFI", subject: "ขอตรวจสอบระบบไฟฟ้าแรงต่ำก่อนปิดฝ้าชั้น 3",                      status: "Reviewing", originatorName: "พิชัย ไฟฟ้าดี" },
      { documentNo: "RFI-2026-003", type: "RFI", subject: "ขอตรวจรับงานกันซึมดาดฟ้าชั้น 16 (Waterproofing Test)",             status: "Approved",  originatorName: "ประเสริฐ แสงทอง" },
      { documentNo: "RFI-2026-004", type: "RFI", subject: "ขอตรวจสอบการติดตั้งเสาเข็มเจาะ Bored Pile หลุมที่ 45-60",         status: "Rejected",  originatorName: "สุรศักดิ์ โครงสร้าง" },

      // ─── VO (subType/discipline = null) × 4 สถานะ ───────────────────────────────
      { documentNo: "VO-2026-001",  type: "VO",  subject: "เปลี่ยนแปลงแนวฐานรากอาคาร B ตามสภาพดินจริงในสนาม",               status: "Pending",   originatorName: "ธนากร ศรีสุข" },
      { documentNo: "VO-2026-002",  type: "VO",  subject: "เพิ่มงานติดตั้งระบบ Solar Cell บนดาดฟ้าอาคาร A",                  status: "Reviewing", originatorName: "วิชัย สถาปัตย์ดี" },
      { documentNo: "VO-2026-003",  type: "VO",  subject: "ลดจำนวนห้องน้ำชั้น 2 จาก 8 ห้องเหลือ 6 ห้องตามแบบแก้ไข",         status: "Approved",  originatorName: "อนันต์ ประปาศาสตร์" },
      { documentNo: "VO-2026-004",  type: "VO",  subject: "เปลี่ยนวัสดุพื้นลานจอดรถจาก Asphalt เป็น Concrete Pavement",      status: "Rejected",  originatorName: "กมล แอร์เย็น" },

      // ─── VR (subType/discipline = null) × 4 สถานะ ───────────────────────────────
      { documentNo: "VR-2026-001",  type: "VR",  subject: "รายงานตรวจรับงานโครงสร้างชั้น 1-5 (Structure Verification)",       status: "Pending",   originatorName: "ภาณุพงศ์ โครงเหล็ก" },
      { documentNo: "VR-2026-002",  type: "VR",  subject: "รายงานตรวจรับระบบดับเพลิงอาคาร A ทั้งหมด (Fire System Test)",      status: "Reviewing", originatorName: "ชาญชัย เซฟตี้" },
      { documentNo: "VR-2026-003",  type: "VR",  subject: "รายงานตรวจรับงานสถาปัตยกรรมภายนอกและ Landscape ครบสมบูรณ์",       status: "Approved",  originatorName: "นิติพงษ์ สถาปนิก" },
      { documentNo: "VR-2026-004",  type: "VR",  subject: "รายงานตรวจรับระบบปรับอากาศ Commissioning Test อาคาร B",            status: "Rejected",  originatorName: "ธีรพล แอร์ซิสเท็ม" },
    ];

    await DocumentModel.insertMany(
      sampleDocs.map((d) => ({ ...d, projectId: projectId || undefined }))
    );

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
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

    // 3. Insert sample documents — ครอบคลุมทุก type / subType / discipline / status (รวม 80 รายการ)
    const sampleDocs = [
      // ═══════════════════════════════════════════════════════════════════════════════
      // 1. RFA · General (discipline = null) × 4 สถานะ
      // ═══════════════════════════════════════════════════════════════════════════════
      { documentNo: "RFA-2026-001", type: "RFA", subType: "General", subject: "ขออนุมัติแผนงานก่อสร้างอาคาร A ระยะที่ 1",                              status: "Pending",   originatorName: "สมชาย วิศวกรรม" },
      { documentNo: "RFA-2026-002", type: "RFA", subType: "General", subject: "ขออนุมัติแบบแปลนพื้นที่จอดรถใต้ดินชั้น B2",                             status: "Reviewing", originatorName: "วิชัย สถาปัตย์ดี" },
      { documentNo: "RFA-2026-003", type: "RFA", subType: "General", subject: "ขออนุมัติเปลี่ยนแปลงแนวทางระบายน้ำรอบอาคาร",                            status: "Approved",  originatorName: "ประเสริฐ แสงทอง" },
      { documentNo: "RFA-2026-004", type: "RFA", subType: "General", subject: "ขออนุมัติแผนจัดการจราจรชั่วคราวระหว่างก่อสร้าง",                         status: "Rejected",  originatorName: "ธนากร ศรีสุข" },

      // ═══════════════════════════════════════════════════════════════════════════════
      // 2. RFA · Material × 8 สาขา × 4 สถานะ (32 รายการ)
      // ═══════════════════════════════════════════════════════════════════════════════
      // AR (สถาปัตย์)
      { documentNo: "RFA-2026-005", type: "RFA", subType: "Material", discipline: "AR", subject: "ขออนุมัติวัสดุกระเบื้องพื้นห้องโถงชั้น 1 (Porcelain Tile 60x60)",       status: "Pending",   originatorName: "นภาพร ดีไซน์" },
      { documentNo: "RFA-2026-006", type: "RFA", subType: "Material", discipline: "AR", subject: "ขออนุมัติวัสดุแผ่นอลูมิเนียมคอมโพสิตหุ้มเสาภายนอกอาคาร",                status: "Reviewing", originatorName: "นภาพร ดีไซน์" },
      { documentNo: "RFA-2026-007", type: "RFA", subType: "Material", discipline: "AR", subject: "ขออนุมัติกระจกลามิเนตนิรภัยหนา 12 มม. สำหรับโถงทางเข้าหลัก",             status: "Approved",  originatorName: "นภาพร ดีไซน์" },
      { documentNo: "RFA-2026-008", type: "RFA", subType: "Material", discipline: "AR", subject: "ขออนุมัติสีทาภายนอกอาคารเกรดพรีเมียมกันเชื้อราและตะไคร่",               status: "Rejected",  originatorName: "นภาพร ดีไซน์" },

      // ST (โครงสร้าง)
      { documentNo: "RFA-2026-009", type: "RFA", subType: "Material", discipline: "ST", subject: "ขออนุมัติเหล็กเสริมคอนกรีตข้ออ้อย SD40 สำหรับเสาชั้น 8-12",             status: "Pending",   originatorName: "สุรศักดิ์ โครงสร้าง" },
      { documentNo: "RFA-2026-010", type: "RFA", subType: "Material", discipline: "ST", subject: "ขออนุมัติน้ำยาประสานคอนกรีตและกาวอีพ็อกซี่สำหรับงานเสียบเหล็ก",         status: "Reviewing", originatorName: "สุรศักดิ์ โครงสร้าง" },
      { documentNo: "RFA-2026-011", type: "RFA", subType: "Material", discipline: "ST", subject: "ขออนุมัติคอนกรีตผสมเสร็จ กำลังอัด 350 ksc สำหรับงานเทแผ่นพื้น",          status: "Approved",  originatorName: "สุรศักดิ์ โครงสร้าง" },
      { documentNo: "RFA-2026-012", type: "RFA", subType: "Material", discipline: "ST", subject: "ขออนุมัติลวดสลิงเหล็กดึงรับแรง Post-Tension ชั้น 5",                     status: "Rejected",  originatorName: "สุรศักดิ์ โครงสร้าง" },

      // EE (ไฟฟ้า)
      { documentNo: "RFA-2026-013", type: "RFA", subType: "Material", discipline: "EE", subject: "ขออนุมัติสายเคเบิลทองแดง NYY 3x95 sq.mm ระบบจ่ายไฟหลัก Main Feeder",      status: "Pending",   originatorName: "พิชัย ไฟฟ้าดี" },
      { documentNo: "RFA-2026-014", type: "RFA", subType: "Material", discipline: "EE", subject: "ขออนุมัติโคมไฟ LED High Bay สำหรับพื้นที่จอดรถและคลังสินค้า",             status: "Reviewing", originatorName: "พิชัย ไฟฟ้าดี" },
      { documentNo: "RFA-2026-015", type: "RFA", subType: "Material", discipline: "EE", subject: "ขออนุมัติตู้ควบคุมระบบไฟฟ้าแรงต่ำ Switchboard MDB",                       status: "Approved",  originatorName: "พิชัย ไฟฟ้าดี" },
      { documentNo: "RFA-2026-016", type: "RFA", subType: "Material", discipline: "EE", subject: "ขออนุมัติท่อร้อยสายไฟเหล็กชุบสังกะสี IMC ขนาด 2 นิ้ว",                   status: "Rejected",  originatorName: "พิชัย ไฟฟ้าดี" },

      // SN (สุขาภิบาล)
      { documentNo: "RFA-2026-017", type: "RFA", subType: "Material", discipline: "SN", subject: "ขออนุมัติท่อ HDPE PN10 สำหรับระบบระบายน้ำเสียและน้ำทิ้งชั้นใต้ดิน",      status: "Pending",   originatorName: "อนันต์ ประปาศาสตร์" },
      { documentNo: "RFA-2026-018", type: "RFA", subType: "Material", discipline: "SN", subject: "ขออนุมัติถังบำบัดน้ำเสียสำเร็จรูปชนิดเติมอากาศ ความจุ 10,000 ลิตร",     status: "Reviewing", originatorName: "อนันต์ ประปาศาสตร์" },
      { documentNo: "RFA-2026-019", type: "RFA", subType: "Material", discipline: "SN", subject: "ขออนุมัติสุขภัณฑ์ประหยัดน้ำและอุปกรณ์ประกอบห้องน้ำชั้น 1-10",           status: "Approved",  originatorName: "อนันต์ ประปาศาสตร์" },
      { documentNo: "RFA-2026-020", type: "RFA", subType: "Material", discipline: "SN", subject: "ขออนุมัติปั๊มน้ำ Booster Pump สำหรับจ่ายน้ำสะอาดชั้น 10-15",             status: "Rejected",  originatorName: "อนันต์ ประปาศาสตร์" },

      // AC (ปรับอากาศ)
      { documentNo: "RFA-2026-021", type: "RFA", subType: "Material", discipline: "AC", subject: "ขออนุมัติเครื่องปรับอากาศ VRF ยี่ห้อ Daikin ขนาด 48,000 BTU",          status: "Pending",   originatorName: "กมล แอร์เย็น" },
      { documentNo: "RFA-2026-022", type: "RFA", subType: "Material", discipline: "AC", subject: "ขออนุมัติฉนวนยางกันความร้อนหุ้มท่อน้ำเย็น Chiller หนา 1 นิ้ว",           status: "Reviewing", originatorName: "กมล แอร์เย็น" },
      { documentNo: "RFA-2026-023", type: "RFA", subType: "Material", discipline: "AC", subject: "ขออนุมัติพัดลมระบายอากาศและพัดลมดูดควันห้องเครื่องกล",                  status: "Approved",  originatorName: "กมล แอร์เย็น" },
      { documentNo: "RFA-2026-024", type: "RFA", subType: "Material", discipline: "AC", subject: "ขออนุมัติหน้ากากแอร์หัวจ่ายลมเย็นชนิด Linear Slot Diffuser",             status: "Rejected",  originatorName: "กมล แอร์เย็น" },

      // ME (เครื่องกล)
      { documentNo: "RFA-2026-025", type: "RFA", subType: "Material", discipline: "ME", subject: "ขออนุมัติปั๊มสูบน้ำซึม Submersible Sump Pump สำหรับบ่อพักชั้นใต้ดิน",   status: "Pending",   originatorName: "วรพจน์ เครื่องกล" },
      { documentNo: "RFA-2026-026", type: "RFA", subType: "Material", discipline: "ME", subject: "ขออนุมัติรอกโซ่ไฟฟ้าขนาด 5 ตัน สำหรับงานซ่อมบำรุงในห้องเครื่อง",        status: "Reviewing", originatorName: "วรพจน์ เครื่องกล" },
      { documentNo: "RFA-2026-027", type: "RFA", subType: "Material", discipline: "ME", subject: "ขออนุมัติชุดแผ่นแดมเปอร์กันสะเทือนเครื่องจักรกำเนิดไฟฟ้า",               status: "Approved",  originatorName: "วรพจน์ เครื่องกล" },
      { documentNo: "RFA-2026-028", type: "RFA", subType: "Material", discipline: "ME", subject: "ขออนุมัติประตูกันเสียงเก็บเสียงห้อง Chiller Plant Room",                 status: "Rejected",  originatorName: "วรพจน์ เครื่องกล" },

      // FP (ดับเพลิง)
      { documentNo: "RFA-2026-029", type: "RFA", subType: "Material", discipline: "FP", subject: "ขออนุมัติหัวสปริงเกลอร์ดับเพลิงแบบ Pendant K-Factor 5.6",               status: "Pending",   originatorName: "ชาญชัย เซฟตี้" },
      { documentNo: "RFA-2026-030", type: "RFA", subType: "Material", discipline: "FP", subject: "ขออนุมัติตู้สายฉีดน้ำดับเพลิง Fire Hose Cabinet พร้อมสาย 30 เมตร",        status: "Reviewing", originatorName: "ชาญชัย เซฟตี้" },
      { documentNo: "RFA-2026-031", type: "RFA", subType: "Material", discipline: "FP", subject: "ขออนุมัติวาล์วควบคุมระบบดับเพลิง Alarm Check Valve ขนาด 6 นิ้ว",         status: "Approved",  originatorName: "ชาญชัย เซฟตี้" },
      { documentNo: "RFA-2026-032", type: "RFA", subType: "Material", discipline: "FP", subject: "ขออนุมัติถังดับเพลิงเคมีแห้ง ABC ขนาด 15 ปอนด์ ประจำทุกชั้น",            status: "Rejected",  originatorName: "ชาญชัย เซฟตี้" },

      // ID (ตกแต่งภายใน)
      { documentNo: "RFA-2026-033", type: "RFA", subType: "Material", discipline: "ID", subject: "ขออนุมัติวอลเปเปอร์ห้องประชุมใหญ่ชั้น 15 (Vinyl Wallpaper)",           status: "Pending",   originatorName: "ปิยะ อินทีเรีย" },
      { documentNo: "RFA-2026-034", type: "RFA", subType: "Material", discipline: "ID", subject: "ขออนุมัติพรมปูพื้นทอพิเศษกันลามไฟ สำหรับห้องรับรองผู้บริหาร",            status: "Reviewing", originatorName: "ปิยะ อินทีเรีย" },
      { documentNo: "RFA-2026-035", type: "RFA", subType: "Material", discipline: "ID", subject: "ขออนุมัติลามิเนตปิดผิวลายไม้ธรรมชาติสำหรับงานเคาน์เตอร์",               status: "Approved",  originatorName: "ปิยะ อินทีเรีย" },
      { documentNo: "RFA-2026-036", type: "RFA", subType: "Material", discipline: "ID", subject: "ขออนุมัติแผ่นฝ้าเพดานอะคูสติกกันเสียงสะท้อนห้อง Auditorium",             status: "Rejected",  originatorName: "ปิยะ อินทีเรีย" },

      // ═══════════════════════════════════════════════════════════════════════════════
      // 3. RFA · Shop Drawing × 8 สาขา × 4 สถานะ (32 รายการ)
      // ═══════════════════════════════════════════════════════════════════════════════
      // AR (สถาปัตย์)
      { documentNo: "RFA-2026-037", type: "RFA", subType: "Shop Drawing", discipline: "AR", subject: "Shop Drawing ผนังกระจก Curtain Wall อาคาร A ด้านทิศใต้",               status: "Pending",   originatorName: "นิติพงษ์ สถาปนิก" },
      { documentNo: "RFA-2026-038", type: "RFA", subType: "Shop Drawing", discipline: "AR", subject: "Shop Drawing บันไดหนีไฟและราวจับสแตนเลสชั้น 1-15",                     status: "Reviewing", originatorName: "นิติพงษ์ สถาปนิก" },
      { documentNo: "RFA-2026-039", type: "RFA", subType: "Shop Drawing", discipline: "AR", subject: "Shop Drawing รายละเอียดฝ้าหลืบซ่อนไฟและฝ้าฉาบเรียบทางเดิน",              status: "Approved",  originatorName: "นิติพงษ์ สถาปนิก" },
      { documentNo: "RFA-2026-040", type: "RFA", subType: "Shop Drawing", discipline: "AR", subject: "Shop Drawing บานประตูและหน้าต่างอลูมิเนียมชั้น 1-5",                   status: "Rejected",  originatorName: "นิติพงษ์ สถาปนิก" },

      // ST (โครงสร้าง)
      { documentNo: "RFA-2026-041", type: "RFA", subType: "Shop Drawing", discipline: "ST", subject: "Shop Drawing โครงเหล็กหลังคา Steel Truss Span 24 เมตร",                 status: "Pending",   originatorName: "ภาณุพงศ์ โครงเหล็ก" },
      { documentNo: "RFA-2026-042", type: "RFA", subType: "Shop Drawing", discipline: "ST", subject: "Shop Drawing รายละเอียดการต่อทาบเหล็กเสา C1 ถึง C10 ชั้น 4-8",          status: "Reviewing", originatorName: "ภาณุพงศ์ โครงเหล็ก" },
      { documentNo: "RFA-2026-043", type: "RFA", subType: "Shop Drawing", discipline: "ST", subject: "Shop Drawing การเสริมเหล็กฐานรากแผ่ Mat Foundation ขนาด 20x20 ม.",         status: "Approved",  originatorName: "ภาณุพงศ์ โครงเหล็ก" },
      { documentNo: "RFA-2026-044", type: "RFA", subType: "Shop Drawing", discipline: "ST", subject: "Shop Drawing คานถ่ายแรง Transfer Beam ชั้น 4 โซนทิศตะวันออก",            status: "Rejected",  originatorName: "ภาณุพงศ์ โครงเหล็ก" },

      // EE (ไฟฟ้า)
      { documentNo: "RFA-2026-045", type: "RFA", subType: "Shop Drawing", discipline: "EE", subject: "Shop Drawing ตู้ MDB และ Single Line Diagram ระบบไฟฟ้าชั้น 1-5",       status: "Pending",   originatorName: "เกียรติศักดิ์ อิเล็คทริค" },
      { documentNo: "RFA-2026-046", type: "RFA", subType: "Shop Drawing", discipline: "EE", subject: "Shop Drawing แนวราง Cable Tray และจุดแยกสายเมนชั้น 6-10",             status: "Reviewing", originatorName: "เกียรติศักดิ์ อิเล็คทริค" },
      { documentNo: "RFA-2026-047", type: "RFA", subType: "Shop Drawing", discipline: "EE", subject: "Shop Drawing ระบบป้องกันฟ้าผ่าและกราวด์ดิ่งบนดาดฟ้า",                 status: "Approved",  originatorName: "เกียรติศักดิ์ อิเล็คทริค" },
      { documentNo: "RFA-2026-048", type: "RFA", subType: "Shop Drawing", discipline: "EE", subject: "Shop Drawing ระบบไฟฉุกเฉินและป้ายสัญลักษณ์ทางหนีไฟ Emergency Light",  status: "Rejected",  originatorName: "เกียรติศักดิ์ อิเล็คทริค" },

      // SN (สุขาภิบาล)
      { documentNo: "RFA-2026-049", type: "RFA", subType: "Shop Drawing", discipline: "SN", subject: "Shop Drawing ระบบท่อน้ำประปาและสุขภัณฑ์ชั้น 6-10",                    status: "Pending",   originatorName: "สมบูรณ์ วิศวะน้ำ" },
      { documentNo: "RFA-2026-050", type: "RFA", subType: "Shop Drawing", discipline: "SN", subject: "Shop Drawing ตำแหน่งช่องเปิด Floor Drain และท่อระบายน้ำทิ้งพื้น",       status: "Reviewing", originatorName: "สมบูรณ์ วิศวะน้ำ" },
      { documentNo: "RFA-2026-051", type: "RFA", subType: "Shop Drawing", discipline: "SN", subject: "Shop Drawing ระบบท่อระบายน้ำฝนจากหลังคาดาดฟ้าลงสู่บ่อหน่วงน้ำ",        status: "Approved",  originatorName: "สมบูรณ์ วิศวะน้ำ" },
      { documentNo: "RFA-2026-052", type: "RFA", subType: "Shop Drawing", discipline: "SN", subject: "Shop Drawing ระบบบำบัดน้ำเสียและบ่อดักไขมันโรงอาหารรวม",              status: "Rejected",  originatorName: "สมบูรณ์ วิศวะน้ำ" },

      // AC (ปรับอากาศ)
      { documentNo: "RFA-2026-053", type: "RFA", subType: "Shop Drawing", discipline: "AC", subject: "Shop Drawing แนวท่อลม Duct Layout ระบบ AHU ชั้น 3",                     status: "Pending",   originatorName: "ธีรพล แอร์ซิสเท็ม" },
      { documentNo: "RFA-2026-054", type: "RFA", subType: "Shop Drawing", discipline: "AC", subject: "Shop Drawing แนวท่อน้ำเย็น Chilled Water Pipe Risers ในช่องชาร์ป",    status: "Reviewing", originatorName: "ธีรพล แอร์ซิสเท็ม" },
      { documentNo: "RFA-2026-055", type: "RFA", subType: "Shop Drawing", discipline: "AC", subject: "Shop Drawing แผนผังการติดตั้ง Condensing Unit บนดาดฟ้าอาคาร",           status: "Approved",  originatorName: "ธีรพล แอร์ซิสเท็ม" },
      { documentNo: "RFA-2026-056", type: "RFA", subType: "Shop Drawing", discipline: "AC", subject: "Shop Drawing ระบบดูดควันฉุกเฉินและอัดอากาศบันไดหนีไฟ",               status: "Rejected",  originatorName: "ธีรพล แอร์ซิสเท็ม" },

      // ME (เครื่องกล)
      { documentNo: "RFA-2026-057", type: "RFA", subType: "Shop Drawing", discipline: "ME", subject: "Shop Drawing ระบบลิฟต์โดยสาร Passenger Elevator 3 ตัว",                 status: "Pending",   originatorName: "อภิชาติ เมคานิค" },
      { documentNo: "RFA-2026-058", type: "RFA", subType: "Shop Drawing", discipline: "ME", subject: "Shop Drawing แผนผังติดตั้งเครื่องกำเนิดไฟฟ้าสำรอง Diesel Generator",    status: "Reviewing", originatorName: "อภิชาติ เมคานิค" },
      { documentNo: "RFA-2026-059", type: "RFA", subType: "Shop Drawing", discipline: "ME", subject: "Shop Drawing การเดินท่อน้ำมันดีเซลจากถังใต้ดินสู่ห้องเครื่องกำเนิดไฟ",  status: "Approved",  originatorName: "อภิชาติ เมคานิค" },
      { documentNo: "RFA-2026-060", type: "RFA", subType: "Shop Drawing", discipline: "ME", subject: "Shop Drawing ฐานแท่นคอนกรีตเสริมสปริงรองรับเครื่องจักรกลลดการสั่น",     status: "Rejected",  originatorName: "อภิชาติ เมคานิค" },

      // FP (ดับเพลิง)
      { documentNo: "RFA-2026-061", type: "RFA", subType: "Shop Drawing", discipline: "FP", subject: "Shop Drawing ระบบท่อสปริงเกลอร์และ Fire Hose Cabinet ชั้น 1-15",       status: "Pending",   originatorName: "สุทธิพงษ์ ไฟร์โปรเทค" },
      { documentNo: "RFA-2026-062", type: "RFA", subType: "Shop Drawing", discipline: "FP", subject: "Shop Drawing แผนผังหัวฉีดก๊าซ Clean Agent ดับเพลิงห้อง Server",          status: "Reviewing", originatorName: "สุทธิพงษ์ ไฟร์โปรเทค" },
      { documentNo: "RFA-2026-063", type: "RFA", subType: "Shop Drawing", discipline: "FP", subject: "Shop Drawing แนวท่อ Main Fire Pipe และห้องเครื่องสูบน้ำ Fire Pump",     status: "Approved",  originatorName: "สุทธิพงษ์ ไฟร์โปรเทค" },
      { documentNo: "RFA-2026-064", type: "RFA", subType: "Shop Drawing", discipline: "FP", subject: "Shop Drawing ผังการติดตั้งแผงควบคุมระบบแจ้งเหตุเพลิงไหม้ Fire Alarm Zone", status: "Rejected",  originatorName: "สุทธิพงษ์ ไฟร์โปรเทค" },

      // ID (ตกแต่งภายใน)
      { documentNo: "RFA-2026-065", type: "RFA", subType: "Shop Drawing", discipline: "ID", subject: "Shop Drawing เคาน์เตอร์ต้อนรับและเฟอร์นิเจอร์ Built-in ล็อบบี้ชั้น 1",  status: "Pending",   originatorName: "จิราพร ดีไซน์สตูดิโอ" },
      { documentNo: "RFA-2026-066", type: "RFA", subType: "Shop Drawing", discipline: "ID", subject: "Shop Drawing ผนังตกแต่ง Acoustic Wall แผ่นซับเสียงห้องประชุมใหญ่",   status: "Reviewing", originatorName: "จิราพร ดีไซน์สตูดิโอ" },
      { documentNo: "RFA-2026-067", type: "RFA", subType: "Shop Drawing", discipline: "ID", subject: "Shop Drawing รายละเอียดตู้เสื้อผ้าและเตียงนอน Built-in ห้องชุดตัวอย่าง", status: "Approved",  originatorName: "จิราพร ดีไซน์สตูดิโอ" },
      { documentNo: "RFA-2026-068", type: "RFA", subType: "Shop Drawing", discipline: "ID", subject: "Shop Drawing ผนังกระจกเงาและงานตกแต่งหินอ่อนห้องน้ำ VIP",              status: "Rejected",  originatorName: "จิราพร ดีไซน์สตูดิโอ" },

      // ═══════════════════════════════════════════════════════════════════════════════
      // 4. RFI (subType/discipline = null) × 4 สถานะ
      // ═══════════════════════════════════════════════════════════════════════════════
      { documentNo: "RFI-2026-001", type: "RFI", subject: "ขอตรวจสอบงานเทคอนกรีตพื้นชั้น 7 (Slab Inspection)",               status: "Pending",   originatorName: "สมชาย วิศวกรรม" },
      { documentNo: "RFI-2026-002", type: "RFI", subject: "ขอตรวจสอบระบบไฟฟ้าแรงต่ำก่อนปิดฝ้าชั้น 3",                      status: "Reviewing", originatorName: "พิชัย ไฟฟ้าดี" },
      { documentNo: "RFI-2026-003", type: "RFI", subject: "ขอตรวจรับงานกันซึมดาดฟ้าชั้น 16 (Waterproofing Test)",             status: "Approved",  originatorName: "ประเสริฐ แสงทอง" },
      { documentNo: "RFI-2026-004", type: "RFI", subject: "ขอตรวจสอบการติดตั้งเสาเข็มเจาะ Bored Pile หลุมที่ 45-60",         status: "Rejected",  originatorName: "สุรศักดิ์ โครงสร้าง" },

      // ═══════════════════════════════════════════════════════════════════════════════
      // 5. VO (subType/discipline = null) × 4 สถานะ
      // ═══════════════════════════════════════════════════════════════════════════════
      { documentNo: "VO-2026-001",  type: "VO",  subject: "เปลี่ยนแปลงแนวฐานรากอาคาร B ตามสภาพดินจริงในสนาม",               status: "Pending",   originatorName: "ธนากร ศรีสุข" },
      { documentNo: "VO-2026-002",  type: "VO",  subject: "เพิ่มงานติดตั้งระบบ Solar Cell บนดาดฟ้าอาคาร A",                  status: "Reviewing", originatorName: "วิชัย สถาปัตย์ดี" },
      { documentNo: "VO-2026-003",  type: "VO",  subject: "ลดจำนวนห้องน้ำชั้น 2 จาก 8 ห้องเหลือ 6 ห้องตามแบบแก้ไข",         status: "Approved",  originatorName: "อนันต์ ประปาศาสตร์" },
      { documentNo: "VO-2026-004",  type: "VO",  subject: "เปลี่ยนวัสดุพื้นลานจอดรถจาก Asphalt เป็น Concrete Pavement",      status: "Rejected",  originatorName: "กมล แอร์เย็น" },

      // ═══════════════════════════════════════════════════════════════════════════════
      // 6. VR (subType/discipline = null) × 4 สถานะ
      // ═══════════════════════════════════════════════════════════════════════════════
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
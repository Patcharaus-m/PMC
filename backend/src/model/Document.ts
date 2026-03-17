import mongoose, { Schema, Document as MongoDocument, Types } from "mongoose";

export interface IDocument extends MongoDocument {
  documentNo: string;
  type: "RFA" | "RFI" | "VO" | "VR";
  subType?: "General" | "Material" | "Shop Drawing";
  discipline?: "AC" | "AR" | "EE" | "FP" | "SN" | "ST";
  subject: string;
  status: "Pending" | "Approved" | "Rejected" | "Reviewing";
  pdfUrl: string;
  originatorId: Types.ObjectId;
  originatorName: string;
  projectId?: Types.ObjectId;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentNo: { type: String, required: true },
    type: {
      type: String,
      enum: ["RFA", "RFI", "VO", "VR"],
      required: true,
    },
    subType: {
      type: String,
      enum: ["General", "Material", "Shop Drawing"],
    },
    discipline: {
      type: String,
      enum: ["AC", "AR", "EE", "FP", "SN", "ST"],
    },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Reviewing"],
      default: "Pending",
    },
    pdfUrl: { type: String },
    originatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    originatorName: { type: String, required: true },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>("Document", DocumentSchema);

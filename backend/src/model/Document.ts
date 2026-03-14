import mongoose, { Schema, Document as MongoDocument, Types } from "mongoose";

export interface IDocument extends MongoDocument {
  documentNo: string;
  type: "RFA" | "RFI" | "VO" | "VR";
  subject: string;
  status: "Pending" | "Approved" | "Rejected" | "Reviewing";
  pdfUrl: string;
  originatorId: Types.ObjectId;
  originatorName: string;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentNo: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["RFA", "RFI", "VO", "VR"],
      required: true,
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
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>("Document", DocumentSchema);

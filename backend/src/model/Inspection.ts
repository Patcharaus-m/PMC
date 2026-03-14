import mongoose, { Schema, Document } from "mongoose";

export interface IInspection extends Document {
  title: string;
  zone: string;
  assignee: string;
  date: Date;
  status: "COMPLETED" | "PENDING" | "IN PROGRESS" | "REJECTED";
  punchListCount: number;
}

const InspectionSchema = new Schema<IInspection>(
  {
    title: { type: String, required: true },
    zone: { type: String, required: true },
    assignee: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["COMPLETED", "PENDING", "IN PROGRESS", "REJECTED"],
      default: "PENDING",
    },
    punchListCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IInspection>("Inspection", InspectionSchema);

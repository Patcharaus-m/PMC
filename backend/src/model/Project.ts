import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPlan {
  order?: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  note?: string;
  color?: string;
  status?: "not_started" | "in_progress" | "completed" | "delayed";
  actualProgress?: number; // 0-100
}

export interface IProject extends Document {
  projectName: string;
  createdBy: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  plannedProgress: number;
  workforceCount: number;
  safetyScore: number;
  incidentCount: number;
  plans: IPlan[];
}

const PlanSchema = new Schema<IPlan>(
  {
    order: { type: String },
    planName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    note: { type: String },
    color: { type: String, default: '#3b82f6' },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "delayed"],
      default: "not_started",
    },
    actualProgress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: true }
);

const ProjectSchema = new Schema<IProject>(
  {
    projectName: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    startDate: { type: Date },
    endDate: { type: Date },
    plannedProgress: { type: Number, default: 0 },
    workforceCount: { type: Number, default: 0 },
    safetyScore: { type: Number, default: 100 },
    incidentCount: { type: Number, default: 0 },
    plans: { type: [PlanSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>("Project", ProjectSchema);

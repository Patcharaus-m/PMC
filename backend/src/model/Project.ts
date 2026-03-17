import mongoose, { Schema, Document } from "mongoose";

export interface IPlan {
  order?: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  note?: string;
  color?: string;
}

export interface IProject extends Document {
  projectName: string;
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
  },
  { _id: true }
);

const ProjectSchema = new Schema<IProject>(
  {
    projectName: { type: String, required: true },
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

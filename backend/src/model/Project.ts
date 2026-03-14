import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  projectName: string;
  startDate: Date;
  endDate: Date;
  plannedProgress: number;
  workforceCount: number;
  safetyScore: number;
  incidentCount: number;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectName: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    plannedProgress: { type: Number, default: 0 },
    workforceCount: { type: Number, default: 0 },
    safetyScore: { type: Number, default: 100 },
    incidentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>("Project", ProjectSchema);

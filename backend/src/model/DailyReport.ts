import mongoose, { Schema, Document } from "mongoose";

export interface IDailyReport extends Document {
  date: Date;
  progressDetail: string;
  actualProgressValue: number;
}

const DailyReportSchema = new Schema<IDailyReport>(
  {
    date: { type: Date, required: true },
    progressDetail: { type: String },
    actualProgressValue: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDailyReport>("DailyReport", DailyReportSchema);

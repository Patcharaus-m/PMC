import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "Admin" | "PM" | "SiteEngineer" | "Inspector" | "DocumentController";
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "PM", "SiteEngineer", "Inspector", "DocumentController"],
      default: "PM",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);

import mongoose from "mongoose";
import config from "@/config";


export async function connectDB() {
  try {
    await mongoose.connect(
      config.DATABASE_URL ?? "mongodb://127.0.0.1:27017/projectdoc"
    );
    console.log("Mongo DB connected");
  } catch (error) {
    console.error("Mongo DB connection error", error);
  }
}

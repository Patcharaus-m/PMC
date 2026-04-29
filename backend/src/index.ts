import express from "express";
import path from "path";
import config from "./config/index.js";
import { connectDB } from "./database/index.js";
import middleware from "./middleware/index.js";
import routes from "./routers/index.js";
import { startRtspRelay } from "./rtsp-relay.js";

const app = express();

// Body parsing (10MB limit for base64 images)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS
app.use(middleware.cors);

// Static file serving for uploaded PDFs
// ใช้ process.cwd() เพื่อให้ชี้ไปที่ Root ของโปรเจกต์เสมอ ป้องกันปัญหา Path เพี้ยนบน Render
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use("/api", routes);

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "PMC Backend API is running" });
});

// Start Server
const PORT = config.HOST_API_PORT || 3000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start RTSP → WebSocket relay for CCTV (attached to same HTTP server)
    startRtspRelay(server);
  });
});
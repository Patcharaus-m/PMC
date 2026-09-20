import express from "express";
import path from "path";
import config from "./config/index.js";
import { connectDB } from "./database/index.js";
import middleware from "./middleware/index.js";
import routes from "./routers/index.js";
import { startRtspRelay } from "./rtsp-relay.js";
import { startDroneRelay, getDroneInfo } from "./drone-relay.js";

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

// Drone status & RTMP connection info
app.get("/api/drone/info", (_req, res) => {
  res.json(getDroneInfo());
});

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "PMC Backend API is running" });
});

// Start Server
const PORT = config.HOST_API_PORT || 3000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start RTSP → WebSocket relay for CCTV (noServer mode)
    const rtspWss = startRtspRelay();

    // Start RTMP → WebSocket relay for Drone (noServer mode)
    const droneWss = startDroneRelay();

    // Route WebSocket upgrade requests to the appropriate relay
    server.on("upgrade", (req, socket, head) => {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;

      if (pathname === "/stream") {
        rtspWss.handleUpgrade(req, socket, head, (ws) => {
          rtspWss.emit("connection", ws, req);
        });
      } else if (pathname === "/drone-stream") {
        droneWss.handleUpgrade(req, socket, head, (ws) => {
          droneWss.emit("connection", ws, req);
        });
      } else {
        socket.destroy();
      }
    });
  });
});
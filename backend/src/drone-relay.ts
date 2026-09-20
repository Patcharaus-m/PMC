/**
 * Drone RTMP → WebSocket Relay
 *
 * Accepts RTMP stream from DJI Fly app (push) and broadcasts it
 * via WebSocket to all connected browser clients.
 *
 * DJI Fly RTMP URL:  rtmp://<SERVER_IP>:1935/live/drone
 * WebSocket path:    /drone-stream
 *
 * Flow:
 *   DJI Fly → RTMP (port 1935) → Node-Media-Server
 *     → postPublish event → FFmpeg (RTMP → mpeg1video MPEG-TS)
 *     → broadcast binary chunks via WebSocket → JSMpeg (browser)
 */

import { spawn, ChildProcess } from "child_process";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { networkInterfaces } from "os";
import NodeMediaServer from "node-media-server";

// ──────────────── Configuration ────────────────
const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
const RTMP_PORT = parseInt(process.env.RTMP_PORT || "1935");
const NMS_HTTP_PORT = parseInt(process.env.NMS_HTTP_PORT || "8888");
// ────────────────────────────────────────────────

type DroneStreamStatus = "waiting" | "online" | "offline";

// ──────────────── Global State ────────────────
let currentStatus: DroneStreamStatus = "waiting";
let ffmpegProc: ChildProcess | null = null;
const wsClients = new Set<WebSocket>();
// ──────────────────────────────────────────────

/** Get all non-internal IPv4 addresses (for showing RTMP URL to user) */
export function getLocalIPs(): string[] {
  const nets = networkInterfaces();
  const results: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        results.push(net.address);
      }
    }
  }
  // Prioritize Mobile Hotspot (192.168.137.x), deprioritize VirtualBox (192.168.56.x)
  results.sort((a, b) => {
    if (a.startsWith("192.168.137.")) return -1;
    if (b.startsWith("192.168.137.")) return 1;
    if (a.startsWith("192.168.56.")) return 1;
    if (b.startsWith("192.168.56.")) return -1;
    return 0;
  });
  return results;
}

export function getDroneInfo() {
  return {
    status: currentStatus,
    rtmpPort: RTMP_PORT,
    streamPath: "/live/drone",
    localIPs: getLocalIPs(),
  };
}

/** Broadcast a JSON status message to all connected browser clients */
function broadcastStatus(status: DroneStreamStatus, message?: string) {
  currentStatus = status;
  const localIPs = getLocalIPs();
  const payload = JSON.stringify({
    type: "status",
    status,
    message,
    rtmpPort: RTMP_PORT,
    localIPs,
  });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/** Broadcast raw binary video data to all connected browser clients */
function broadcastBinary(chunk: Buffer) {
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(chunk);
    }
  }
}

/** Safely kill a child process with SIGTERM → SIGKILL fallback */
function safeKill(proc: ChildProcess | null) {
  if (!proc) return;
  try {
    if (!proc.killed) {
      proc.kill("SIGTERM");
      const forceKillTimer = setTimeout(() => {
        try {
          if (!proc.killed) {
            proc.kill("SIGKILL");
            console.log("💀  [Drone Relay] Force-killed zombie ffmpeg process");
          }
        } catch {
          /* already dead */
        }
      }, 3000);
      forceKillTimer.unref();
    }
  } catch {
    /* process already exited */
  }
}

/**
 * Spawn FFmpeg to transcode RTMP → MPEG-TS (mpeg1video)
 * and broadcast to all WebSocket clients.
 */
function startFFmpeg(rtmpUrl: string) {
  console.log(`🎥  [Drone Relay] Starting FFmpeg for: ${rtmpUrl}`);

  try {
    const proc = spawn(FFMPEG_PATH, [
      "-i",
      rtmpUrl,
      "-f",
      "mpegts",
      "-codec:v",
      "mpeg1video",
      "-b:v",
      "1500k",
      "-r",
      "25",
      "-s",
      "960x540",
      "-an",
      "-q:v",
      "5",
      "-",
    ]);

    let hasReceivedData = false;

    proc.stdout?.on("data", (chunk: Buffer) => {
      if (!hasReceivedData) {
        hasReceivedData = true;
        console.log("📺  [Drone Relay] Receiving video data from drone");
        broadcastStatus("online", "โดรนออนไลน์ — กำลังรับภาพสด");
      }
      broadcastBinary(chunk);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString();
      // Log connection errors but skip noisy ffmpeg progress lines
      if (
        msg.includes("Connection refused") ||
        msg.includes("Connection timed out") ||
        msg.includes("Server returned")
      ) {
        console.error(
          `❌  [Drone Relay] FFmpeg error: ${msg.trim().slice(0, 200)}`
        );
      }
      // Uncomment for full ffmpeg debug output:
      // console.log("ffmpeg:", msg);
    });

    proc.on("close", (code) => {
      console.log(`⚠️  [Drone Relay] FFmpeg exited (code ${code})`);
      ffmpegProc = null;
      broadcastStatus("waiting", "โดรนหยุดส่งสัญญาณ — รอสัญญาณใหม่…");
    });

    proc.on("error", (err) => {
      console.error(`❌  [Drone Relay] FFmpeg error: ${err.message}`);
      ffmpegProc = null;
      broadcastStatus("waiting", `FFmpeg error: ${err.message}`);
    });

    return proc;
  } catch (err: any) {
    console.error(
      `❌  [Drone Relay] Failed to spawn FFmpeg: ${err.message}`
    );
    broadcastStatus("waiting", "ไม่พบ FFmpeg — กรุณาติดตั้ง FFmpeg");
    return null;
  }
}

/**
 * Start the Drone RTMP → WebSocket relay.
 * Attaches a WebSocket server at /drone-stream to the given HTTP server.
 */
export function startDroneRelay(_httpServer?: Server): WebSocketServer {
  // ── 1. Start RTMP Server (Node-Media-Server) ──
  const nmsConfig = {
    logType: 1, // 0 = none, 1 = error, 2 = normal, 3 = debug
    rtmp: {
      port: RTMP_PORT,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },
    http: {
      port: NMS_HTTP_PORT,
      allow_origin: "*",
    },
  };

  const nms = new NodeMediaServer(nmsConfig);
  nms.run();

  // ── 2. Handle RTMP publish events ──
  // node-media-server v3+ passes a single object: { session, broadcast }
  nms.on("postPublish", (eventData: any) => {
    const streamPath =
      eventData?.broadcast?.streamPath ??
      eventData?.streamPath ??
      (typeof eventData === "string" ? eventData : undefined);
    const sessionId =
      eventData?.session?.id ?? eventData?.id ?? "unknown";

    console.log(
      `📡  [Drone Relay] Stream started: ${streamPath} (session: ${sessionId})`
    );

    if (streamPath === "/live/drone") {
      // Kill existing ffmpeg if any (e.g. pilot reconnected)
      safeKill(ffmpegProc);

      // Small delay to let NMS fully register the stream
      setTimeout(() => {
        const rtmpUrl = `rtmp://localhost:${RTMP_PORT}${streamPath}`;
        ffmpegProc = startFFmpeg(rtmpUrl);
      }, 1000);
    }
  });

  nms.on("donePublish", (eventData: any) => {
    const streamPath =
      eventData?.broadcast?.streamPath ??
      eventData?.streamPath ??
      (typeof eventData === "string" ? eventData : undefined);
    const sessionId =
      eventData?.session?.id ?? eventData?.id ?? "unknown";

    console.log(
      `📴  [Drone Relay] Stream ended: ${streamPath} (session: ${sessionId})`
    );

    if (streamPath === "/live/drone") {
      safeKill(ffmpegProc);
      ffmpegProc = null;
      broadcastStatus("waiting", "โดรนหยุดส่งสัญญาณ — รอสัญญาณใหม่…");
    }
  });

  // ── 3. WebSocket Server for browser clients ──
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket) => {
    wsClients.add(ws);
    console.log(
      `✅  [Drone Relay] Browser client connected (total: ${wsClients.size})`
    );

    // Send current status + RTMP URL info immediately
    const localIPs = getLocalIPs();
    ws.send(
      JSON.stringify({
        type: "status",
        status: currentStatus,
        message:
          currentStatus === "online"
            ? "โดรนออนไลน์ — กำลังรับภาพสด"
            : "รอสัญญาณจากโดรน…",
        rtmpPort: RTMP_PORT,
        localIPs,
      })
    );

    ws.on("close", () => {
      wsClients.delete(ws);
      console.log(
        `❎  [Drone Relay] Browser client disconnected (total: ${wsClients.size})`
      );
    });

    ws.on("error", () => {
      wsClients.delete(ws);
    });
  });

  wss.on("error", (err) => {
    console.error("[Drone Relay] WebSocket Server error:", err.message);
  });

  // ── 4. Print RTMP URL info ──
  const localIPs = getLocalIPs();
  console.log(`\n📡  [Drone Relay] ==========================================`);
  console.log(`    RTMP Server listening on port ${RTMP_PORT}`);
  console.log(`    WebSocket path: /drone-stream`);
  console.log(`    ──────────────────────────────────────────`);
  console.log(`    🎮  DJI Fly RTMP URLs (ใส่ URL นี้ใน DJI Fly):`);
  for (const ip of localIPs) {
    console.log(`       rtmp://${ip}:${RTMP_PORT}/live/drone`);
  }
  if (localIPs.length === 0) {
    console.log(`       rtmp://<YOUR_IP>:${RTMP_PORT}/live/drone`);
  }
  console.log(`    ==========================================\n`);
  return wss;
}

/**
 * RTSP → WebSocket Relay (Per-Client) — Resilient Edition
 *
 * Each browser client sends its desired RTSP URL as a query parameter.
 * The server spawns a dedicated ffmpeg process per client, transcoding
 * RTSP → MPEG-TS (mpeg1video) and pushing raw bytes over WebSocket.
 *
 * Features:
 *   ✅ Error handling — ffmpeg crash / camera offline won't crash Node.js
 *   ✅ Zombie process prevention — force-kill ffmpeg on disconnect/error
 *   ✅ Status broadcast — sends JSON { status } to frontend via WebSocket
 *   ✅ Auto-reconnect — retries ffmpeg every 10s when camera is unreachable
 *
 * WebSocket URL format:
 *   wss://your-server.com/stream?url=rtsp://user:pass@ip:554/stream1
 *
 * Prerequisites: ffmpeg must be installed and available in PATH.
 */

import { spawn, ChildProcess } from "child_process";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";

// ──────────────── Configuration ────────────────
const DEFAULT_RTSP_URL = "rtsp://somchai:Test1234@192.168.137.249:554/stream1";
const RECONNECT_INTERVAL_MS = 10_000; // 10 seconds
const FFMPEG_CONNECT_TIMEOUT_MS = 15_000; // 15 seconds before declaring timeout

// Use system ffmpeg from PATH (works on Linux/Render and Windows if ffmpeg is in PATH)
// Override with FFMPEG_PATH env variable if needed
const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
// ────────────────────────────────────────────────

/** Status messages sent to frontend as JSON */
type StreamStatus = "connecting" | "online" | "offline" | "reconnecting";

function sendStatus(ws: WebSocket, status: StreamStatus, message?: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "status", status, message }));
  }
}

/**
 * Safely kill an ffmpeg child process, including force-kill fallback.
 * Prevents zombie processes from accumulating.
 */
function safeKill(proc: ChildProcess | null | undefined) {
  if (!proc) return;
  try {
    if (!proc.killed) {
      proc.kill("SIGTERM");
      // Force kill after 3 seconds if SIGTERM didn't work
      const forceKillTimer = setTimeout(() => {
        try {
          if (!proc.killed) {
            proc.kill("SIGKILL");
            console.log("💀  [RTSP Relay] Force-killed zombie ffmpeg process");
          }
        } catch { /* already dead, ignore */ }
      }, 3000);
      forceKillTimer.unref(); // Don't block Node.js exit
    }
  } catch {
    /* process already exited, ignore */
  }
}

/** Per-client state */
interface ClientState {
  proc: ChildProcess | null;
  rtspUrl: string;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  isUserDisconnected: boolean; // true = user clicked disconnect, don't auto-reconnect
}

/**
 * Spawn an ffmpeg process for a specific RTSP URL,
 * piping output only to the given WebSocket client.
 * Returns the ChildProcess (or null if spawn failed immediately).
 */
function spawnFFmpegForClient(
  ws: WebSocket,
  rtspUrl: string,
  clientState: ClientState,
  scheduleReconnect: () => void,
): ChildProcess | null {
  console.log(`🎥  [RTSP Relay] Spawning ffmpeg for: ${rtspUrl}`);
  sendStatus(ws, "connecting", "กำลังเชื่อมต่อกล้อง…");

  let hasReceivedData = false;
  let connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  let proc: ChildProcess;

  try {
    proc = spawn(FFMPEG_PATH, [
      "-rtsp_transport", "tcp",
      "-timeout", "10000000",    // RTSP timeout 10s (in microseconds)
      "-i", rtspUrl,
      "-f", "mpegts",
      "-codec:v", "mpeg1video",
      "-b:v", "1500k",
      "-r", "25",
      "-s", "960x540",
      "-an",
      "-q:v", "5",
      "-",
    ]);
  } catch (err: any) {
    console.error(`❌  [RTSP Relay] Failed to spawn ffmpeg: ${err.message}`);
    sendStatus(ws, "offline", "ไม่พบ ffmpeg — กรุณาติดตั้ง ffmpeg");
    scheduleReconnect();
    return null;
  }

  // ── Connection timeout: if no data arrives within 15s, consider it failed ──
  connectTimeoutTimer = setTimeout(() => {
    if (!hasReceivedData && proc && !proc.killed) {
      console.log(`⏰  [RTSP Relay] Connection timeout for: ${rtspUrl}`);
      sendStatus(ws, "offline", "หมดเวลาเชื่อมต่อกล้อง (Timeout)");
      safeKill(proc);
      clientState.proc = null;
      scheduleReconnect();
    }
  }, FFMPEG_CONNECT_TIMEOUT_MS);

  // ── stdout: video data → send to browser ──
  proc.stdout?.on("data", (chunk: Buffer) => {
    if (!hasReceivedData) {
      hasReceivedData = true;
      if (connectTimeoutTimer) {
        clearTimeout(connectTimeoutTimer);
        connectTimeoutTimer = null;
      }
      sendStatus(ws, "online", "กล้องออนไลน์");
      console.log(`📺  [RTSP Relay] Receiving video data for: ${rtspUrl}`);
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  // ── stderr: ffmpeg logs (detect connection errors) ──
  proc.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString();
    // Detect common RTSP failure patterns
    if (
      msg.includes("Connection refused") ||
      msg.includes("Connection timed out") ||
      msg.includes("No route to host") ||
      msg.includes("Network is unreachable") ||
      msg.includes("Could not find codec") ||
      msg.includes("Server returned 4") ||
      msg.includes("401 Unauthorized")
    ) {
      console.error(`❌  [RTSP Relay] ffmpeg error detected: ${msg.trim().slice(0, 200)}`);
    }
    // Uncomment for full ffmpeg debug output:
    // console.log("ffmpeg:", msg);
  });

  // ── process close: camera disconnected or ffmpeg crashed ──
  proc.on("close", (code) => {
    console.log(`⚠️  [RTSP Relay] ffmpeg exited (code ${code}) for: ${rtspUrl}`);
    if (connectTimeoutTimer) {
      clearTimeout(connectTimeoutTimer);
      connectTimeoutTimer = null;
    }
    clientState.proc = null;

    // If the user didn't manually disconnect, treat as camera offline → auto-reconnect
    if (!clientState.isUserDisconnected && ws.readyState === WebSocket.OPEN) {
      sendStatus(ws, "offline", "กล้องขาดการเชื่อมต่อ");
      scheduleReconnect();
    }
  });

  // ── process error: ffmpeg binary not found or spawn error ──
  proc.on("error", (err) => {
    console.error(`❌  [RTSP Relay] ffmpeg process error: ${err.message}`);
    if (connectTimeoutTimer) {
      clearTimeout(connectTimeoutTimer);
      connectTimeoutTimer = null;
    }
    clientState.proc = null;

    if (!clientState.isUserDisconnected && ws.readyState === WebSocket.OPEN) {
      sendStatus(ws, "offline", `ffmpeg error: ${err.message}`);
      scheduleReconnect();
    }
  });

  return proc;
}

/**
 * Attach RTSP relay WebSocket to an existing HTTP server.
 * WebSocket path: /stream
 */
export function startRtspRelay(server: Server) {
  const wss = new WebSocketServer({ server, path: "/stream" });

  // Track per-client state
  const clients = new Map<WebSocket, ClientState>();

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Parse RTSP URL from query parameter
    const params = new URL(req.url || "/", "http://localhost").searchParams;
    const rtspUrl = params.get("url") || DEFAULT_RTSP_URL;

    console.log(`✅  [RTSP Relay] Client connected (total: ${wss.clients.size})`);
    console.log(`    RTSP URL: ${rtspUrl}`);

    // Initialize client state
    const clientState: ClientState = {
      proc: null,
      rtspUrl,
      reconnectTimer: null,
      isUserDisconnected: false,
    };
    clients.set(ws, clientState);

    // ── Schedule auto-reconnect ──
    const scheduleReconnect = () => {
      // Clear any existing reconnect timer
      if (clientState.reconnectTimer) {
        clearTimeout(clientState.reconnectTimer);
        clientState.reconnectTimer = null;
      }

      // Don't reconnect if user manually disconnected or WS is closed
      if (clientState.isUserDisconnected || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      sendStatus(ws, "reconnecting", `กำลังลองเชื่อมต่อใหม่ใน ${RECONNECT_INTERVAL_MS / 1000} วินาที…`);

      clientState.reconnectTimer = setTimeout(() => {
        clientState.reconnectTimer = null;
        if (clientState.isUserDisconnected || ws.readyState !== WebSocket.OPEN) {
          return;
        }
        console.log(`🔄  [RTSP Relay] Auto-reconnecting to: ${rtspUrl}`);
        clientState.proc = spawnFFmpegForClient(ws, rtspUrl, clientState, scheduleReconnect);
      }, RECONNECT_INTERVAL_MS);
    };

    // ── Cleanup helper ──
    const cleanup = () => {
      clientState.isUserDisconnected = true; // prevent further reconnects
      if (clientState.reconnectTimer) {
        clearTimeout(clientState.reconnectTimer);
        clientState.reconnectTimer = null;
      }
      safeKill(clientState.proc);
      clientState.proc = null;
      clients.delete(ws);
    };

    // ── Spawn initial ffmpeg ──
    clientState.proc = spawnFFmpegForClient(ws, rtspUrl, clientState, scheduleReconnect);

    // ── WebSocket close ──
    ws.on("close", () => {
      console.log(`❎  [RTSP Relay] Client disconnected (total: ${wss.clients.size})`);
      cleanup();
    });

    // ── WebSocket error ──
    ws.on("error", (err) => {
      console.error("[RTSP Relay] WebSocket error:", err.message);
      cleanup();
    });
  });

  // ── Global uncaught error guard for the WebSocket server ──
  wss.on("error", (err) => {
    console.error("[RTSP Relay] WebSocketServer error:", err.message);
  });

  console.log(`📡  [RTSP Relay] WebSocket attached at path /stream`);
  console.log(`    Default RTSP: ${DEFAULT_RTSP_URL}`);
  console.log(`    Auto-reconnect: every ${RECONNECT_INTERVAL_MS / 1000}s`);
  console.log(`    Usage: wss://your-server/stream?url=rtsp://user:pass@ip:554/stream`);
}

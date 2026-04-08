/**
 * RTSP → WebSocket Relay (Per-Client)
 *
 * Each browser client sends its desired RTSP URL as a query parameter.
 * The server spawns a dedicated ffmpeg process per client, transcoding
 * RTSP → MPEG-TS (mpeg1video) and pushing raw bytes over WebSocket.
 *
 * WebSocket URL format:
 *   ws://localhost:9999?url=rtsp://user:pass@ip:554/stream1
 *
 * Prerequisites: ffmpeg must be installed.
 */

import { spawn, ChildProcess } from "child_process";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import path from "path";
import os from "os";

// ──────────────── Configuration ────────────────
const WS_PORT = 9999;
const DEFAULT_RTSP_URL = "rtsp://somchai:Test1234@192.168.137.249:554/stream1";

// ffmpeg path — full path for winget installation on Windows
const FFMPEG_PATH = path.join(
  os.homedir(),
  "AppData", "Local", "Microsoft", "WinGet", "Packages",
  "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
  "ffmpeg-8.1-full_build", "bin", "ffmpeg.exe"
);
// ────────────────────────────────────────────────

/**
 * Spawn an ffmpeg process for a specific RTSP URL,
 * piping output only to the given WebSocket client.
 */
function spawnFFmpegForClient(ws: WebSocket, rtspUrl: string): ChildProcess {
  console.log(`🎥  [RTSP Relay] Spawning ffmpeg for: ${rtspUrl}`);

  const proc = spawn(FFMPEG_PATH, [
    "-rtsp_transport", "tcp",
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

  proc.stdout?.on("data", (chunk: Buffer) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  proc.stderr?.on("data", (_data: Buffer) => {
    // Uncomment for debugging:
    // console.log("ffmpeg:", _data.toString());
  });

  proc.on("close", (code) => {
    console.log(`⚠️  [RTSP Relay] ffmpeg exited (code ${code}) for: ${rtspUrl}`);
  });

  proc.on("error", (err) => {
    console.error(`❌  [RTSP Relay] ffmpeg error: ${err.message}`);
  });

  return proc;
}

export function startRtspRelay() {
  const wss = new WebSocketServer({ port: WS_PORT });

  // Track per-client ffmpeg processes
  const clientProcesses = new Map<WebSocket, ChildProcess>();

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Parse RTSP URL from query parameter
    const params = new URL(req.url || "/", `http://localhost:${WS_PORT}`).searchParams;
    const rtspUrl = params.get("url") || DEFAULT_RTSP_URL;

    console.log(`✅  [RTSP Relay] Client connected (total: ${wss.clients.size})`);
    console.log(`    RTSP URL: ${rtspUrl}`);

    // Spawn dedicated ffmpeg for this client
    const proc = spawnFFmpegForClient(ws, rtspUrl);
    clientProcesses.set(ws, proc);

    ws.on("close", () => {
      console.log(`❎  [RTSP Relay] Client disconnected (total: ${wss.clients.size})`);
      // Kill ffmpeg for this client
      const p = clientProcesses.get(ws);
      if (p) {
        p.kill("SIGTERM");
        clientProcesses.delete(ws);
      }
    });

    ws.on("error", (err) => {
      console.error("[RTSP Relay] WebSocket error:", err.message);
      const p = clientProcesses.get(ws);
      if (p) {
        p.kill("SIGTERM");
        clientProcesses.delete(ws);
      }
    });
  });

  console.log(`📡  [RTSP Relay] WebSocket ready → ws://localhost:${WS_PORT}`);
  console.log(`    Default RTSP: ${DEFAULT_RTSP_URL}`);
  console.log(`    Usage: ws://localhost:${WS_PORT}?url=rtsp://user:pass@ip:554/stream`);
}

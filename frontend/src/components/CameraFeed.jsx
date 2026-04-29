import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Play, Square, Maximize2, Wifi, WifiOff, Loader2, Settings, Link, RefreshCw, AlertTriangle } from 'lucide-react';

// Backend host — override with VITE_BACKEND_URL for local dev (e.g. http://localhost:3000)
const BACKEND_HOST = import.meta.env.VITE_BACKEND_URL || 'https://pmc-alwb.onrender.com';
const WS_BASE = BACKEND_HOST.replace(/^http/, 'ws') + '/stream';
const DEFAULT_RTSP = 'rtsp://somchai:Test1234@192.168.137.249:554/stream1';

/**
 * Camera stream statuses:
 *  - disconnected:  user has not connected / manually disconnected
 *  - connecting:    WebSocket is open, waiting for ffmpeg to connect to camera
 *  - online:        receiving video frames
 *  - offline:       camera unreachable (ffmpeg failed), waiting for reconnect
 *  - reconnecting:  auto-reconnect countdown in progress
 */

const CameraFeed = ({ id, zone, defaultRtspUrl, time = '00:45:12' }) => {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const [statusMessage, setStatusMessage] = useState('');
  const [uptime, setUptime] = useState('00:00:00');
  const [rtspUrl, setRtspUrl] = useState(defaultRtspUrl || DEFAULT_RTSP);
  const [showSettings, setShowSettings] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const startTimeRef = useRef(null);
  const uptimeTimerRef = useRef(null);

  // ── Uptime counter ──
  const startUptime = useCallback(() => {
    if (uptimeTimerRef.current) return;
    startTimeRef.current = Date.now();
    uptimeTimerRef.current = setInterval(() => {
      const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
  }, []);

  const stopUptime = useCallback(() => {
    clearInterval(uptimeTimerRef.current);
    uptimeTimerRef.current = null;
    setUptime('00:00:00');
  }, []);

  // ── Build WS URL with RTSP as query param ──
  const buildWsUrl = useCallback(() => {
    return `${WS_BASE}?url=${encodeURIComponent(rtspUrl)}`;
  }, [rtspUrl]);

  // ── Connect ──
  const connect = useCallback(() => {
    if (wsRef.current) return;
    setStatus('connecting');
    setStatusMessage('กำลังเชื่อมต่อ…');
    setShowSettings(false);
    setRetryCount(0);

    const wsUrl = buildWsUrl();

    // Load jsmpeg from CDN if not already loaded
    const initPlayer = () => {
      // Create JSMpeg Player normally — it manages its own WebSocket
      const player = new window.JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        loop: false,
      });
      playerRef.current = player;

      // Poll for the internal WebSocket to attach our status interceptor
      const checkWs = setInterval(() => {
        const sock = player?.source?.socket;
        if (!sock) return;
        clearInterval(checkWs);
        wsRef.current = sock;

        // Intercept messages: filter JSON status messages, let binary through to JSMpeg
        const origOnMessage = sock.onmessage;
        sock.onmessage = (event) => {
          // Try to detect JSON status messages (small text or small binary)
          let isStatusMsg = false;
          if (typeof event.data === 'string') {
            isStatusMsg = true;
          } else if (event.data instanceof ArrayBuffer && event.data.byteLength < 300) {
            try {
              const text = new TextDecoder().decode(event.data);
              if (text.startsWith('{') && text.includes('"type"')) {
                isStatusMsg = true;
                // Re-create event as a string for parsing below
                Object.defineProperty(event, '_statusText', { value: text });
              }
            } catch { /* not text */ }
          }

          if (isStatusMsg) {
            try {
              const text = typeof event.data === 'string'
                ? event.data
                : event._statusText || new TextDecoder().decode(event.data);
              const parsed = JSON.parse(text);

              if (parsed.type === 'status') {
                setStatusMessage(parsed.message || '');

                if (parsed.status === 'online') {
                  setStatus('online');
                  startUptime();
                  setRetryCount(0);
                } else if (parsed.status === 'offline') {
                  setStatus('offline');
                  stopUptime();
                } else if (parsed.status === 'reconnecting') {
                  setStatus('reconnecting');
                  stopUptime();
                  setRetryCount((prev) => prev + 1);
                } else if (parsed.status === 'connecting') {
                  setStatus('connecting');
                }
                return; // Don't pass to JSMpeg
              }
            } catch {
              // Not valid JSON status — fall through to JSMpeg
            }
          }

          // Pass non-status messages to JSMpeg's original handler
          if (origOnMessage) origOnMessage.call(sock, event);
        };

        sock.addEventListener('close', () => {
          setStatus('disconnected');
          setStatusMessage('');
          stopUptime();
        });

        sock.addEventListener('error', () => {
          setStatus('offline');
          setStatusMessage('ไม่สามารถเชื่อมต่อ WebSocket ได้');
          stopUptime();
        });
      }, 100);
    };

    if (window.JSMpeg) {
      initPlayer();
    } else {
      const script = document.createElement('script');
      script.src = 'https://jsmpeg.com/jsmpeg.min.js';
      script.onload = initPlayer;
      document.head.appendChild(script);
    }
  }, [buildWsUrl, startUptime, stopUptime]);

  // ── Cleanup helper ──
  const cleanup = useCallback(() => {
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    }
    wsRef.current = null;
  }, []);

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    cleanup();
    setStatus('disconnected');
    setStatusMessage('');
    setRetryCount(0);
    stopUptime();

    // Clear canvas
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [cleanup, stopUptime]);

  // ── Fullscreen ──
  const toggleFullscreen = () => {
    const wrapper = canvasRef.current?.parentElement;
    if (!document.fullscreenElement) {
      wrapper?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      clearInterval(uptimeTimerRef.current);
    };
  }, [cleanup]);

  const isOnline = status === 'online';
  const isConnecting = status === 'connecting';
  const isDisconnected = status === 'disconnected';
  const isOffline = status === 'offline';
  const isReconnecting = status === 'reconnecting';
  const showVideo = isOnline;
  const showOverlay = !isOnline;

  return (
    <div className={`
      aspect-video bg-[#0f1423] rounded-2xl border p-0 relative overflow-hidden flex flex-col w-full min-w-0
      transition-all duration-300
      ${isOnline ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
        isOffline || isReconnecting ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
        'border-gray-800'}
    `}>
      
      {/* Top Bar */}
      <div className="flex justify-between items-start relative z-10 p-3 lg:p-4 pb-0 gap-2">
        <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
          {isOnline ? (
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse shrink-0"></span>
          ) : isOffline || isReconnecting ? (
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full shrink-0"></span>
          ) : (
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-600 rounded-full shrink-0"></span>
          )}
          <span className="text-[8px] sm:text-[10px] font-mono text-gray-200">
            {isOnline ? `REC ${uptime}` :
             isOffline ? '🔴 ออฟไลน์' :
             isReconnecting ? `🔄 ลองใหม่ #${retryCount}` :
             'ออฟไลน์'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="bg-blue-600/20 text-blue-400 text-[8px] sm:text-[10px] px-2 py-1 rounded border border-blue-500/30 font-bold uppercase truncate">
            CAM-{id} | {zone}
          </div>
          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`shrink-0 p-1.5 rounded-lg border transition-all duration-200 ${showSettings ? 'bg-blue-600/30 text-blue-400 border-blue-500/40' : 'bg-black/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white'}`}
            title="ตั้งค่า RTSP URL"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* RTSP URL Settings Panel (slide down) */}
      {showSettings && (
        <div className="relative z-20 mx-3 mt-2 bg-[#1a2235] border border-gray-700 rounded-xl p-3 animate-in">
          <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            <Link size={10} />
            RTSP URL
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              disabled={!isDisconnected}
              placeholder="rtsp://user:pass@ip:port/stream"
              className="flex-1 bg-[#0f1423] border border-gray-700 rounded-lg px-2.5 py-1.5 text-[10px] sm:text-xs text-gray-200 font-mono placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
            />
            {isDisconnected && (
              <button
                onClick={() => setRtspUrl(DEFAULT_RTSP)}
                className="shrink-0 bg-gray-700/50 hover:bg-gray-700 text-gray-400 text-[8px] sm:text-[9px] font-bold px-2 py-1.5 rounded-lg transition-colors uppercase"
                title="รีเซ็ตค่าเริ่มต้น"
              >
                รีเซ็ต
              </button>
            )}
          </div>
          {!isDisconnected && (
            <p className="text-[8px] text-amber-500/80 mt-1.5 font-medium">
              ⚠ ตัดการเชื่อมต่อก่อนเปลี่ยน URL
            </p>
          )}
        </div>
      )}
      
      {/* Canvas / Video area */}
      <div className="flex-1 relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scanline overlay when connected */}
        {isOnline && (
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)'
          }} />
        )}
        
        {/* ──── Fallback UI overlays ──── */}

        {/* Disconnected: show camera icon */}
        {isDisconnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-[2]">
            <Camera className="text-gray-700/50" size={36} />
            <span className="text-[10px] text-gray-600 font-medium">กดปุ่มเชื่อมต่อเพื่อรับสัญญาณ</span>
          </div>
        )}

        {/* Connecting: spinner */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-[2] bg-black/30 backdrop-blur-sm">
            <Loader2 className="text-blue-400 animate-spin" size={28} />
            <span className="text-[10px] text-blue-300 font-medium">
              {statusMessage || 'กำลังเชื่อมต่อ …'}
            </span>
          </div>
        )}

        {/* Offline: camera is unreachable */}
        {isOffline && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2] bg-black/60 backdrop-blur-sm">
            <div className="relative">
              <Camera className="text-red-400/80" size={40} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">!</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] sm:text-xs text-red-400 font-bold">
                🔴 กล้องออฟไลน์
              </p>
              <p className="text-[9px] sm:text-[10px] text-red-300/70 mt-0.5">
                Camera Offline
              </p>
            </div>
            {statusMessage && (
              <p className="text-[8px] sm:text-[9px] text-gray-400 bg-black/40 px-2.5 py-1 rounded-full max-w-[90%] truncate">
                {statusMessage}
              </p>
            )}
          </div>
        )}

        {/* Reconnecting: animated retry indicator */}
        {isReconnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2] bg-black/60 backdrop-blur-sm">
            <div className="relative">
              <RefreshCw className="text-amber-400 animate-spin" size={32} style={{ animationDuration: '2s' }} />
            </div>
            <div className="text-center">
              <p className="text-[11px] sm:text-xs text-amber-400 font-bold">
                กำลังลองเชื่อมต่อใหม่…
              </p>
              <p className="text-[9px] sm:text-[10px] text-amber-300/70 mt-0.5">
                Auto-Reconnecting (ครั้งที่ {retryCount})
              </p>
            </div>
            {statusMessage && (
              <p className="text-[8px] sm:text-[9px] text-gray-400 bg-black/40 px-2.5 py-1 rounded-full max-w-[90%] truncate">
                {statusMessage}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle size={9} className="text-gray-500" />
              <span className="text-[8px] text-gray-500">Server จะลองเชื่อมต่อใหม่อัตโนมัติทุก 10 วินาที</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-3 lg:px-4 py-2 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {isDisconnected ? (
            <button
              onClick={connect}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
            >
              <Play size={11} fill="white" />
              เชื่อมต่อ
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
            >
              <Square size={11} fill="white" />
              ตัดการเชื่อมต่อ
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-gray-300 text-[9px] sm:text-[10px] px-2 py-1.5 rounded-lg transition-all duration-200"
          >
            <Maximize2 size={11} />
          </button>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold ${
          isOnline ? 'text-emerald-400' :
          isConnecting ? 'text-amber-400' :
          isReconnecting ? 'text-amber-400' :
          isOffline ? 'text-red-400' :
          'text-gray-500'
        }`}>
          {isOnline ? <Wifi size={11} /> :
           isConnecting ? <Loader2 size={11} className="animate-spin" /> :
           isReconnecting ? <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '2s' }} /> :
           isOffline ? <WifiOff size={11} /> :
           <WifiOff size={11} />}
          {isOnline ? 'ออนไลน์' :
           isConnecting ? 'กำลังเชื่อมต่อ...' :
           isReconnecting ? `ลองใหม่ #${retryCount}` :
           isOffline ? 'ออฟไลน์' :
           'ไม่ได้เชื่อมต่อ'}
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
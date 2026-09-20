import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Maximize2, Wifi, WifiOff, Loader2, Radio, Info, Copy, Check } from 'lucide-react';

// Backend host resolver (supports LAN / mobile hotspot / localhost)
const getBackendHost = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  return 'http://203.170.129.155';
};

const getWsUrl = () => {
  return getBackendHost().replace(/^http/, 'ws') + '/drone-stream';
};

/**
 * DroneFeed — Live drone video feed component
 *
 * Auto-connects to WebSocket on mount and displays:
 *   - "waiting"     → รอสัญญาณจากโดรน (pulse animation)
 *   - "online"      → ภาพสด LIVE + HUD overlay
 *   - "offline"     → สัญญาณขาดหาย (auto-reconnect)
 *   - "connecting"  → กำลังเชื่อมต่อเซิร์ฟเวอร์
 */
const DroneFeed = () => {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const wsCheckIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState('connecting');
  const [statusMessage, setStatusMessage] = useState('');
  const [rtmpPort, setRtmpPort] = useState(1935);
  const [localIPs, setLocalIPs] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uptime, setUptime] = useState('00:00:00');

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
    if (uptimeTimerRef.current) {
      clearInterval(uptimeTimerRef.current);
      uptimeTimerRef.current = null;
    }
    setUptime('00:00:00');
  }, []);

  // ── Cleanup helper ──
  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (wsCheckIntervalRef.current) {
      clearInterval(wsCheckIntervalRef.current);
      wsCheckIntervalRef.current = null;
    }
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    }
    wsRef.current = null;
  }, []);

  // ── Connect WebSocket + JSMpeg ──
  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Clean up previous connection
    cleanup();

    setStatus('connecting');
    setStatusMessage('กำลังเชื่อมต่อเซิร์ฟเวอร์…');

    const initPlayer = () => {
      if (!mountedRef.current || !canvasRef.current) return;

      let canvas = canvasRef.current;
      let player;
      try {
        player = new window.JSMpeg.Player(getWsUrl(), {
          canvas: canvas,
          autoplay: true,
          audio: false,
          loop: false,
        });
      } catch (glErr) {
        console.warn('[DroneFeed] WebGL failed, resetting canvas for 2D fallback:', glErr);
        try {
          if (canvas.parentNode) {
            const freshCanvas = canvas.cloneNode(false);
            canvas.parentNode.replaceChild(freshCanvas, canvas);
            canvasRef.current = freshCanvas;
            canvas = freshCanvas;
          }
          player = new window.JSMpeg.Player(getWsUrl(), {
            canvas: canvas,
            autoplay: true,
            audio: false,
            loop: false,
            disableGl: true,
          });
        } catch (err) {
          console.error('[DroneFeed] Failed to create JSMpeg Player:', err);
          setStatus('offline');
          setStatusMessage('ไม่สามารถสร้าง Player ได้');
          reconnectTimerRef.current = setTimeout(() => connect(), 5000);
          return;
        }
      }
      playerRef.current = player;

      // Connection timeout — if WS doesn't connect in 10s, retry
      connectTimeoutRef.current = setTimeout(() => {
        if (!wsRef.current && mountedRef.current) {
          console.log('[DroneFeed] Connection timeout, retrying...');
          cleanup();
          setStatus('offline');
          setStatusMessage('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
          reconnectTimerRef.current = setTimeout(() => connect(), 3000);
        }
      }, 10000);

      // Poll for JSMpeg's internal WebSocket
      wsCheckIntervalRef.current = setInterval(() => {
        const sock = playerRef.current?.source?.socket;
        if (!sock) return;
        clearInterval(wsCheckIntervalRef.current);
        wsCheckIntervalRef.current = null;
        wsRef.current = sock;

        // Clear connection timeout
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }

        // Intercept messages: filter JSON status, let binary through to JSMpeg
        const origOnMessage = sock.onmessage;
        sock.onmessage = (event) => {
          let isStatusMsg = false;

          if (typeof event.data === 'string') {
            isStatusMsg = true;
          } else if (event.data instanceof ArrayBuffer && event.data.byteLength < 500) {
            try {
              const text = new TextDecoder().decode(event.data);
              if (text.startsWith('{') && text.includes('"type"')) {
                isStatusMsg = true;
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
                } else if (parsed.status === 'waiting') {
                  setStatus('waiting');
                  stopUptime();
                } else if (parsed.status === 'offline') {
                  setStatus('offline');
                  stopUptime();
                }

                // Save RTMP connection info
                if (parsed.rtmpPort) setRtmpPort(parsed.rtmpPort);
                if (parsed.localIPs) setLocalIPs(parsed.localIPs);

                return; // Don't pass to JSMpeg
              }
            } catch { /* not valid JSON, fall through */ }
          }

          // Pass binary video data to JSMpeg's original handler
          if (origOnMessage) origOnMessage.call(sock, event);
        };

        // Handle WebSocket close → auto-reconnect
        sock.addEventListener('close', () => {
          if (!mountedRef.current) return;
          setStatus('offline');
          setStatusMessage('การเชื่อมต่อเซิร์ฟเวอร์หลุด');
          stopUptime();
          playerRef.current = null;
          wsRef.current = null;
          // Auto-reconnect after 3 seconds
          reconnectTimerRef.current = setTimeout(() => connect(), 3000);
        });

        sock.addEventListener('error', () => {
          // The 'close' event will handle reconnection
        });
      }, 100);
    };

    // Load JSMpeg from CDN if not loaded yet
    if (window.JSMpeg) {
      initPlayer();
    } else {
      const existingScript = document.querySelector('script[src*="jsmpeg"]');
      if (existingScript) {
        // Script exists but may still be loading
        if (window.JSMpeg) {
          initPlayer();
        } else {
          existingScript.addEventListener('load', initPlayer);
        }
      } else {
        const script = document.createElement('script');
        script.src = 'https://jsmpeg.com/jsmpeg.min.js';
        script.onload = initPlayer;
        script.onerror = () => {
          setStatus('offline');
          setStatusMessage('ไม่สามารถโหลด JSMpeg library');
          reconnectTimerRef.current = setTimeout(() => connect(), 5000);
        };
        document.head.appendChild(script);
      }
    }
  }, [cleanup, startUptime, stopUptime]);

  // ── Fetch drone info via REST immediately on mount ──
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${getBackendHost()}/api/drone/info`);
        if (res.ok) {
          const data = await res.json();
          if (data.rtmpPort) setRtmpPort(data.rtmpPort);
          if (data.localIPs && data.localIPs.length > 0) setLocalIPs(data.localIPs);
        }
      } catch (err) {
        console.warn('[DroneFeed] Initial drone info fetch failed:', err);
      }
    };
    fetchInfo();
  }, []);

  // ── Auto-connect on mount ──
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      cleanup();
      stopUptime();
    };
  }, [connect, cleanup, stopUptime]);

  // ── Fullscreen ──
  const toggleFullscreen = () => {
    const wrapper = canvasRef.current?.closest('.drone-feed-container');
    if (!document.fullscreenElement) {
      wrapper?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // ── Copy RTMP URL ──
  const copyRtmpUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  const isOnline = status === 'online';
  const isWaiting = status === 'waiting';
  const isConnecting = status === 'connecting';
  const isOffline = status === 'offline';

  return (
    <div className="drone-feed-container flex flex-col gap-4">

      {/* ──── Video Area ──── */}
      <div className={`
        aspect-video bg-[#1a2133] rounded-xl border relative overflow-hidden group
        transition-all duration-500
        ${isOnline ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.1)]' :
          isOffline ? 'border-red-500/30' :
          'border-gray-800'}
      `}>

        {/* Canvas for JSMpeg video */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500
            ${isOnline ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* ── HUD Overlay (visible when live) ── */}
        {isOnline && (
          <div className="absolute inset-0 pointer-events-none z-[1]">
            {/* Scanline effect */}
            <div className="absolute inset-0" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)'
            }} />
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-400/50 rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-400/50 rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-400/50 rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-400/50 rounded-br-sm" />
            {/* Crosshair center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border border-blue-400/30 rounded-full" />
              <div className="absolute w-8 h-8 border border-blue-400/40 rounded-full" />
              <div className="absolute w-[1px] h-10 bg-blue-400/20" />
              <div className="absolute w-10 h-[1px] bg-blue-400/20" />
            </div>
            {/* Top info bar */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <span className="text-[8px] font-mono text-green-400/90 bg-black/50 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> LIVE
              </span>
              <span className="text-[8px] font-mono text-blue-300/80 bg-black/50 px-2 py-0.5 rounded">
                REC {uptime}
              </span>
            </div>
            {/* Bottom label */}
            <div className="absolute bottom-3 left-3 text-[7px] font-mono text-blue-200/60 bg-black/40 px-2 py-1 rounded">
              DJI Mini 4K | LIVE STREAM
            </div>
          </div>
        )}

        {/* ── Waiting overlay ── */}
        {isWaiting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2]">
            <div className="relative">
              <Radio className="text-gray-500" size={36} />
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400/40" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500/60" />
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-semibold">รอสัญญาณจากโดรน...</p>
              <p className="text-[9px] text-gray-600 mt-1">Waiting for drone stream</p>
            </div>
          </div>
        )}

        {/* ── Connecting overlay ── */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2]">
            <Loader2 className="text-blue-400 animate-spin" size={28} />
            <p className="text-[10px] text-blue-300 font-medium">
              {statusMessage || 'กำลังเชื่อมต่อเซิร์ฟเวอร์…'}
            </p>
          </div>
        )}

        {/* ── Offline / reconnecting overlay ── */}
        {isOffline && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-[2] bg-black/40">
            <WifiOff className="text-amber-400/70" size={32} />
            <div className="text-center">
              <p className="text-xs text-amber-400 font-semibold">สัญญาณขาดหาย</p>
              <p className="text-[9px] text-amber-300/60 mt-0.5">กำลังเชื่อมต่อใหม่อัตโนมัติ…</p>
            </div>
          </div>
        )}

        {/* Fullscreen button (visible on hover) */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* ──── Status Bar ──── */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
          isOnline ? 'text-green-400 bg-green-900/20 border-green-800/50' :
          isWaiting ? 'text-blue-400 bg-blue-900/20 border-blue-800/50' :
          isOffline ? 'text-amber-400 bg-amber-900/20 border-amber-800/50' :
          'text-gray-500 bg-gray-800/30 border-gray-700/50'
        }`}>
          {isOnline ? <><Wifi size={10} /> ออนไลน์ — ภาพสด</> :
           isWaiting ? <><Radio size={10} className="animate-pulse" /> รอสัญญาณโดรน</> :
           isConnecting ? <><Loader2 size={10} className="animate-spin" /> เชื่อมต่อ...</> :
           <><WifiOff size={10} /> กำลังเชื่อมต่อใหม่...</>}
        </div>

        {/* Info button - show RTMP URL for DJI Fly */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${
            showInfo
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
              : 'text-gray-500 hover:text-gray-300 border border-gray-700/50 hover:border-gray-600'
          }`}
        >
          <Info size={10} />
          ตั้งค่า DJI Fly
        </button>
      </div>

      {/* ──── RTMP URL Info Panel ──── */}
      {showInfo && (
        <div className="bg-[#1a2133] border border-gray-700 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
              RTMP URL สำหรับ DJI Fly
            </p>
            {localIPs.length > 0 ? (
              <div className="space-y-1.5">
                {localIPs.map((ip, i) => {
                  const url = `rtmp://${ip}:${rtmpPort}/live/drone`;
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <code className="flex-1 bg-[#0f1423] text-blue-300 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-gray-700 truncate">
                        {url}
                      </code>
                      <button
                        onClick={() => copyRtmpUrl(url)}
                        className="shrink-0 p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                        title="คัดลอก URL"
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <code className="block bg-[#0f1423] text-gray-400 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-gray-700">
                กำลังโหลด... (เชื่อมต่อเซิร์ฟเวอร์ก่อน)
              </code>
            )}
          </div>

          <div className="border-t border-gray-700/50 pt-3">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">
              วิธีตั้งค่าใน DJI Fly (ครั้งแรกครั้งเดียว)
            </p>
            <ol className="space-y-1.5 text-[10px] text-gray-400">
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold shrink-0">1.</span>
                เปิด DJI Fly → กด <code className="bg-gray-800 px-1 rounded text-gray-300">···</code> ขวาบน
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold shrink-0">2.</span>
                ไปที่ <span className="text-gray-300">Transmission → Live Streaming</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold shrink-0">3.</span>
                เลือก <span className="text-gray-300">RTMP</span> แล้ววาง URL ด้านบน
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold shrink-0">4.</span>
                กด <span className="text-green-400 font-bold">Start Live Stream</span>
              </li>
            </ol>
            <p className="text-[8px] text-gray-600 mt-2 italic">
              💡 ตั้งค่าครั้งเดียว เที่ยวบินถัดไปแค่กด Start
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroneFeed;

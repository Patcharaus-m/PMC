import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Play, Square, Maximize2, Wifi, WifiOff, Loader2, Settings, Link } from 'lucide-react';

const WS_BASE = 'ws://localhost:9999';
const DEFAULT_RTSP = 'rtsp://somchai:Test1234@192.168.137.249:554/stream1';

const CameraFeed = ({ id, zone, defaultRtspUrl, time = '00:45:12' }) => {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [uptime, setUptime] = useState('00:00:00');
  const [rtspUrl, setRtspUrl] = useState(defaultRtspUrl || DEFAULT_RTSP);
  const [showSettings, setShowSettings] = useState(false);
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
    if (playerRef.current) return;
    setStatus('connecting');
    setShowSettings(false); // Close settings panel on connect

    const wsUrl = buildWsUrl();

    // Load jsmpeg from CDN if not already loaded
    const initPlayer = () => {
      playerRef.current = new window.JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        loop: false,
        onPlay: () => {
          setStatus('connected');
          startUptime();
        },
        onStalled: () => {
          // keep connected status, just buffering
        },
      });

      // Listen on underlying WebSocket for accurate status
      const checkWs = setInterval(() => {
        if (playerRef.current?.source?.socket) {
          const sock = playerRef.current.source.socket;
          sock.addEventListener('open', () => {
            setStatus('connected');
            startUptime();
          });
          sock.addEventListener('close', () => {
            setStatus('disconnected');
            stopUptime();
          });
          sock.addEventListener('error', () => {
            setStatus('disconnected');
            stopUptime();
          });
          clearInterval(checkWs);
        }
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

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setStatus('disconnected');
    stopUptime();

    // Clear canvas
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [stopUptime]);

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
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      clearInterval(uptimeTimerRef.current);
    };
  }, []);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isDisconnected = status === 'disconnected';

  return (
    <div className={`
      aspect-video bg-[#0f1423] rounded-2xl border p-0 relative overflow-hidden flex flex-col w-full min-w-0
      transition-all duration-300
      ${isConnected ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-gray-800'}
    `}>
      
      {/* Top Bar */}
      <div className="flex justify-between items-start relative z-10 p-3 lg:p-4 pb-0 gap-2">
        <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
          {isConnected ? (
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse shrink-0"></span>
          ) : (
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-600 rounded-full shrink-0"></span>
          )}
          <span className="text-[8px] sm:text-[10px] font-mono text-gray-200">
            {isConnected ? `REC ${uptime}` : 'OFFLINE'}
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
              disabled={isConnected || isConnecting}
              placeholder="rtsp://user:pass@ip:port/stream"
              className="flex-1 bg-[#0f1423] border border-gray-700 rounded-lg px-2.5 py-1.5 text-[10px] sm:text-xs text-gray-200 font-mono placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
            />
            {isDisconnected && (
              <button
                onClick={() => setRtspUrl(DEFAULT_RTSP)}
                className="shrink-0 bg-gray-700/50 hover:bg-gray-700 text-gray-400 text-[8px] sm:text-[9px] font-bold px-2 py-1.5 rounded-lg transition-colors uppercase"
                title="Reset to default"
              >
                Reset
              </button>
            )}
          </div>
          {isConnected && (
            <p className="text-[8px] text-amber-500/80 mt-1.5 font-medium">
              ⚠ Disconnect ก่อนเปลี่ยน URL
            </p>
          )}
        </div>
      )}
      
      {/* Canvas / Video area */}
      <div className="flex-1 relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Scanline overlay when connected */}
        {isConnected && (
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)'
          }} />
        )}
        
        {/* Disconnected overlay */}
        {isDisconnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-[2]">
            <Camera className="text-gray-700/50" size={36} />
            <span className="text-[10px] text-gray-600 font-medium">กดปุ่ม Connect เพื่อรับสัญญาณ</span>
          </div>
        )}

        {/* Connecting spinner */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-[2] bg-black/30 backdrop-blur-sm">
            <Loader2 className="text-blue-400 animate-spin" size={28} />
            <span className="text-[10px] text-blue-300 font-medium">กำลังเชื่อมต่อ …</span>
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
              Connect
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
            >
              <Square size={11} fill="white" />
              Disconnect
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
          isConnected ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-gray-500'
        }`}>
          {isConnected ? <Wifi size={11} /> : isConnecting ? <Loader2 size={11} className="animate-spin" /> : <WifiOff size={11} />}
          {isConnected ? 'LIVE' : isConnecting ? 'CONNECTING' : 'OFFLINE'}
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
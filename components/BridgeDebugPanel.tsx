'use client';

import React, { useEffect, useRef } from 'react';
import { BridgeLogEntry } from '@/lib/bridgeEmitter';

interface BridgeDebugPanelProps {
  logs: BridgeLogEntry[];
  npuMemory: number;
  micActive: boolean;
  cameraStatus: string;
  tokenSpeed: number;
}

export default function BridgeDebugPanel({
  logs,
  npuMemory,
  micActive,
  cameraStatus,
  tokenSpeed
}: BridgeDebugPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getNpuColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLogBadgeColor = (type: string) => {
    switch (type) {
      case 'npu': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'mic': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'camera': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'token': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'system': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number, l = 2) => n.toString().padStart(l, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  };

  return (
    <div className="flex flex-col gap-4 font-mono w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NPU Memory */}
        <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="text-zinc-400 text-sm mb-2">NPU Memory</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-semibold text-zinc-200">{npuMemory}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getNpuColor(npuMemory)}`}
              style={{ width: `${npuMemory}%` }}
            />
          </div>
        </div>

        {/* Mic Status */}
        <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="text-zinc-400 text-sm mb-2">Microphone Status</div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-4 w-4">
              {micActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-4 w-4 ${micActive ? 'bg-green-500' : 'bg-zinc-600'}`}></span>
            </div>
            <span className={`text-xl font-semibold ${micActive ? 'text-zinc-200' : 'text-zinc-500'}`}>
              {micActive ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Camera Status */}
        <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="text-zinc-400 text-sm mb-2">Camera Status</div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-4 w-4">
              {cameraStatus === 'CAPTURING' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-4 w-4 ${cameraStatus === 'CAPTURING' ? 'bg-cyan-400' : cameraStatus === 'READY' ? 'bg-cyan-600' : 'bg-zinc-600'}`}></span>
            </div>
            <span className={`text-xl font-semibold ${cameraStatus === 'CAPTURING' ? 'text-cyan-300' : cameraStatus === 'READY' ? 'text-zinc-200' : 'text-zinc-500'}`}>
              {cameraStatus}
            </span>
          </div>
        </div>

        {/* Token Speed */}
        <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
          <div className="text-zinc-400 text-sm mb-2">Token Speed</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-semibold ${tokenSpeed > 0 ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-zinc-500'}`}>
              {tokenSpeed.toFixed(1)}
            </span>
            <span className="text-zinc-500 text-sm">tok/s</span>
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 h-[400px] relative overflow-hidden flex flex-col shadow-inner">
        {/* Grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }}
        ></div>
        
        <div className="text-zinc-500 text-xs mb-4 uppercase tracking-wider relative z-10 border-b border-zinc-800 pb-2">
          System Logs
        </div>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-2 relative z-10 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 text-sm hover:bg-zinc-800/30 p-1.5 rounded transition-colors">
              <span className="text-zinc-600 whitespace-nowrap">[{formatTime(log.timestamp)}]</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border whitespace-nowrap min-w-[50px] text-center ${getLogBadgeColor(log.type)}`}>
                {log.type}
              </span>
              <span className="text-zinc-300 break-all">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-zinc-600 italic">Waiting for telemetry...</div>
          )}
        </div>
      </div>
    </div>
  );
}

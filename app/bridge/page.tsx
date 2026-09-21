'use client';

import React, { useEffect, useState } from 'react';
import BridgeDebugPanel from '@/components/BridgeDebugPanel';
import { createBridgeEmitter, BridgeLogEntry } from '@/lib/bridgeEmitter';

export default function BridgePage() {
  const [logs, setLogs] = useState<BridgeLogEntry[]>([]);
  const [npuMemory, setNpuMemory] = useState<number>(0);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [cameraStatus, setCameraStatus] = useState<string>('READY');
  const [tokenSpeed, setTokenSpeed] = useState<number>(0);

  useEffect(() => {
    const handleLog = (entry: BridgeLogEntry) => {
      setLogs((prev) => {
        const newLogs = [...prev, entry];
        // keep only the last 100 logs
        if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
        return newLogs;
      });

      if (entry.type === 'npu' && typeof entry.value === 'number') {
        setNpuMemory(entry.value);
      } else if (entry.type === 'mic' && typeof entry.value === 'boolean') {
        setMicActive(entry.value);
      } else if (entry.type === 'camera' && typeof entry.value === 'string') {
        setCameraStatus(entry.value);
      } else if (entry.type === 'token' && typeof entry.value === 'number') {
        setTokenSpeed(entry.value);
      }
    };

    const cleanup = createBridgeEmitter(handleLog);
    return cleanup;
  }, []);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-300 flex flex-col relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 relative z-10 flex flex-col">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-zinc-100 drop-shadow-sm">
            Mission Control &mdash; Vernacular AI
          </h1>
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-full shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-mono text-zinc-300 font-medium tracking-wider uppercase">
              Connected
            </span>
          </div>
        </header>

        {/* Main Telemetry Interface */}
        <main className="flex-1 flex flex-col w-full">
          <BridgeDebugPanel 
            logs={logs}
            npuMemory={npuMemory}
            micActive={micActive}
            cameraStatus={cameraStatus}
            tokenSpeed={tokenSpeed}
          />
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-zinc-600 font-mono text-sm pb-4 tracking-wide uppercase">
          Tethered Device Bridge &bull; Snapdragon NPU Runtime
        </footer>
      </div>
    </div>
  );
}

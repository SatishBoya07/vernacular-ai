'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-950 text-zinc-50 p-4 text-center">
      <WifiOff className="w-24 h-24 text-zinc-600 mb-6" />
      <h1 className="text-2xl font-bold mb-2">You are offline</h1>
      <p className="text-zinc-400 mb-8">Please check your internet connection</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors font-medium"
      >
        Retry Connection
      </button>
    </div>
  );
}

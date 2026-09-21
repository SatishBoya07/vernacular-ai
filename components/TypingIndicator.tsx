'use client';

import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1.5 py-1 px-1" aria-label="Loading response">
      <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]"></span>
      <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]"></span>
      <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce"></span>
    </div>
  );
}

export default TypingIndicator;

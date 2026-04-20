'use client';

import React, { useState } from 'react';
import { Menu, Ghost, Search, Image as ImageIcon } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const [activeMode, setActiveMode] = useState<'ask' | 'imagine'>('ask');

  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-black border-b border-zinc-900 sticky top-0 z-30">
      {/* Menu Icon */}
      <button 
        onClick={onMenuClick}
        className="p-2 text-zinc-400 hover:text-white transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mode Toggle (Ask / Imagine) */}
      <div className="flex bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
        <button
          onClick={() => setActiveMode('ask')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeMode === 'ask' 
              ? 'bg-zinc-800 text-white shadow-lg' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Ask
        </button>
        <button
          onClick={() => setActiveMode('imagine')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeMode === 'imagine' 
              ? 'bg-zinc-800 text-white shadow-lg' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Imagine
        </button>
      </div>

      {/* Bot/Ghost Icon */}
      <button className="p-2 text-zinc-400 hover:text-white transition-colors">
        <Ghost className="w-6 h-6" />
      </button>
    </header>
  );
}

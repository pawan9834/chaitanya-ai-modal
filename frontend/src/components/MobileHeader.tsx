'use client';

import React, { useState } from 'react';
import { Menu, Ghost, Search, Image as ImageIcon } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const [activeMode, setActiveMode] = useState<'ask' | 'imagine'>('ask');

  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--background)] border-b border-[var(--border-dim)] sticky top-0 z-30 transition-colors duration-300">
      {/* Menu Icon */}
      <button 
        onClick={onMenuClick}
        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors duration-300"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mode Toggle (Ask / Imagine) */}
      <div className="flex bg-[var(--surface-hover)] p-1 rounded-full border border-[var(--border-dim)]">
        <button
          onClick={() => setActiveMode('ask')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
            activeMode === 'ask' 
              ? 'bg-[var(--text-main)] text-[var(--background)] shadow-lg' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Ask
        </button>
        <button
          onClick={() => setActiveMode('imagine')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
            activeMode === 'imagine' 
              ? 'bg-[var(--text-main)] text-[var(--background)] shadow-lg' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Imagine
        </button>
      </div>

      {/* Bot/Ghost Icon */}
      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors duration-300">
        <Ghost className="w-6 h-6" />
      </button>
    </header>
  );
}

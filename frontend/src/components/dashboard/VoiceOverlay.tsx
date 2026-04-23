'use client';

import React from 'react';
import { X, Mic } from 'lucide-react';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceOverlay({ isOpen, onClose }: VoiceOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--background)]/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-[var(--surface-hover)] rounded-2xl text-[var(--text-main)]">
        <X className="w-6 h-6" />
      </button>
      <div className="relative group mb-12">
        <div className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full animate-pulse [animation-duration:2s]" />
        <div className="w-48 h-48 rounded-full border border-orange-500/20 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-ping [animation-duration:3s]" />
          <div className="w-32 h-32 bg-orange-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-orange-500/40 animate-pulse [animation-duration:1s]">
            <Mic className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>
      <h2 className="text-4xl font-black tracking-tighter text-[var(--text-main)] mb-2 uppercase italic">Listening</h2>
      <p className="text-[var(--text-muted)] font-medium text-center max-w-xs leading-relaxed">
        AstraVex is optimizing for your voice. Just speak your mind.
      </p>
    </div>
  );
}

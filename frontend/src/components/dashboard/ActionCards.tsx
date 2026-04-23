'use client';

import React from 'react';
import { Sparkles, Video, Camera, AudioLines, FileSearch } from 'lucide-react';

interface ActionCardsProps {
  userName: string;
  onVideo: () => void;
  onCamera: () => void;
  onVoice: () => void;
  onAnalyze: () => void;
}

export default function ActionCards({ userName, onVideo, onCamera, onVoice, onAnalyze }: ActionCardsProps) {
  const actions = [
    { icon: <Video className="w-5 h-5" />, title: "Create Videos", desc: "AI-generated motion", action: onVideo },
    { icon: <Camera className="w-5 h-5" />, title: "Open Camera", desc: "Visual analysis", action: onCamera },
    { icon: <AudioLines className="w-5 h-5" />, title: "Voice Mode", desc: "Real-time conversation", action: onVoice },
    { icon: <FileSearch className="w-5 h-5" />, title: "Analyze docs", desc: "Data processing", action: onAnalyze },
  ];

  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <div className="hidden md:block text-center space-y-6 mb-12">
        <h1 className="text-6xl font-black tracking-tighter flex items-center justify-center gap-4">
          Hello, {userName} <Sparkles className="w-10 h-10" />
        </h1>
        <p className="text-[var(--text-muted)] text-lg font-medium">How can AstraVex help you today?</p>
      </div>

      <div className="md:hidden mb-12 flex items-center justify-center">
        <div className="w-24 h-24 border-2 border-[var(--border-dim)] rounded-full flex items-center justify-center text-5xl font-black text-[var(--text-muted)]">
          <div className="w-16 h-16 border border-[var(--border-dim)] rounded-full flex items-center justify-center rotate-12 scale-110 opacity-50">
            A
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 scrollbar-hide md:overflow-visible md:pb-0">
        <div className="flex md:grid md:grid-cols-2 gap-3 md:gap-4 min-w-max md:min-w-0 px-2 md:px-0">
          {actions.map((action, i) => (
            <div
              key={i}
              onClick={action.action}
              className="p-5 md:p-6 bg-[var(--surface)] border border-[var(--border-dim)] rounded-2xl transition-all cursor-pointer hover:bg-[var(--surface-hover)] hover:scale-[1.02] active:scale-95 group w-[160px] md:w-auto overflow-hidden relative shadow-lg"
            >
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-orange-500">
                Live
              </div>
              <div className="text-orange-500 mb-3 transition-colors">
                {action.icon}
              </div>
              <h3 className="text-[var(--text-main)] font-bold text-xs md:text-base mb-1">{action.title}</h3>
              <p className="text-[var(--text-muted)] text-[10px] md:text-sm">{action.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

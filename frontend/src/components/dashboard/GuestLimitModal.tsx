'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuestLimitModal({ isOpen, onClose }: GuestLimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-[var(--surface)]/80 border border-[var(--border-dim)] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 relative overflow-hidden group">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 blur-[80px] rounded-full group-hover:bg-orange-500/30 transition-all duration-700" />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600/20 flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-orange-500/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-[900] text-center mb-4 tracking-tighter text-[var(--text-main)] uppercase">
            Peak <span className="text-orange-500">AstraVex</span>
          </h2>
          <p className="text-[var(--text-muted)] text-center mb-10 leading-relaxed font-medium">
            You've hit the guest limit. Join thousands of users unlocking <span className="text-[var(--text-main)] font-black">Unlimited Intelligence</span>, secure chat history, and premium AI generation.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-500/40"
            >
              Create Account / Sign In
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-main)] transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

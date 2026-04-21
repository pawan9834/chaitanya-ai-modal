'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import SettingsLayout from '@/components/SettingsLayout';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="px-4 py-6 border-b border-zinc-800/50 flex items-center gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-zinc-800 rounded-full text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-white tracking-tight">Settings</h1>
      </header>

      {/* Settings Content */}
      <main className="flex-grow flex flex-col">
        <SettingsLayout isMobile={true} />
      </main>
    </div>
  );
}

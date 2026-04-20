'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { 
  Sparkles, 
  Paperclip, 
  Mic, 
  ChevronDown,
  Video,
  Camera,
  AudioLines,
  FileSearch,
} from 'lucide-react';

export default function DashboardShell() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Protect the route
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Handle loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-svh w-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-hidden relative">
      {/* Universal Background Layer */}
      <div className="fixed inset-0 z-0 text-center pointer-events-none">
        <div className="absolute inset-0 grok-grid opacity-30"></div>
        <div className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] bg-zinc-600/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-1/4 -right-20 w-[40rem] h-[40rem] bg-zinc-700/10 rounded-full blur-[120px] animate-blob [animation-delay:3s]"></div>
      </div>

      <Sidebar 
        mobileOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      <main className="flex-grow z-10 flex flex-col h-full relative overflow-hidden">
        <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col items-center px-4 md:px-8 scrollbar-hide py-4 md:py-10 justify-between md:justify-center overflow-hidden">
          <div className="w-full max-w-4xl flex flex-col items-center h-full md:h-auto">
            
            <div className="flex-grow flex flex-col items-center justify-center w-full">
              {/* Greeting (Desktop Only) */}
              <div className="hidden md:block text-center space-y-6 mb-12">
                <h1 className="text-6xl font-black tracking-tighter flex items-center justify-center gap-4">
                  Hello, {user.name.split(' ')[0]} <Sparkles className="w-10 h-10 text-white" />
                </h1>
                <p className="text-zinc-500 text-lg font-medium">How can Chaitanya AI help you today?</p>
              </div>

              {/* Mobile Central Icon (Grok Style) */}
              <div className="md:hidden mb-12 flex items-center justify-center">
                <div className="w-24 h-24 border-2 border-zinc-900 rounded-full flex items-center justify-center text-5xl font-black text-zinc-800">
                  <div className="w-16 h-16 border border-zinc-800 rounded-full flex items-center justify-center rotate-12 scale-110 opacity-50">
                      C
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid / Scroll */}
              <div className="w-full overflow-x-auto pb-4 scrollbar-hide md:overflow-visible md:pb-0">
                <div className="flex md:grid md:grid-cols-2 gap-3 md:gap-4 min-w-max md:min-w-0 px-2 md:px-0 scrollbar-hide">
                  {[
                    { icon: <Video className="w-5 h-5" />, title: "Create Videos", desc: "AI-generated motion", color: "text-zinc-400" },
                    { icon: <Camera className="w-5 h-5" />, title: "Open Camera", desc: "Visual analysis", color: "text-zinc-400" },
                    { icon: <AudioLines className="w-5 h-5" />, title: "Voice Mode", desc: "Real-time conversation", color: "text-zinc-400" },
                    { icon: <FileSearch className="w-5 h-5" />, title: "Analyze docs", desc: "Data processing", color: "text-zinc-400" },
                  ].map((action, i) => (
                    <div 
                      key={i}
                      className="p-5 md:p-6 bg-zinc-950/50 border border-zinc-900 rounded-2xl hover:border-zinc-100 transition-all cursor-pointer group w-[160px] md:w-auto overflow-hidden"
                    >
                      <div className={`${action.color} group-hover:text-white mb-3 transition-colors`}>
                        {action.icon}
                      </div>
                      <h3 className="text-white font-bold text-xs md:text-base mb-1">{action.title}</h3>
                      <p className="text-zinc-600 text-[10px] md:text-sm">{action.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Input Bar - Anchored to bottom on mobile */}
            <div className="w-full mt-auto mb-10 md:mb-0 md:mt-16 bg-zinc-950/80 border border-zinc-800 p-2 md:p-3 rounded-3xl md:rounded-[32px] transition-all focus-within:border-zinc-600 relative z-50">
              <div className="flex flex-col">
                <input 
                  type="text" 
                  placeholder="Ask anything..." 
                  className="w-full bg-transparent p-4 rounded-2xl text-base md:text-lg focus:outline-none placeholder-zinc-700"
                />
                
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-[10px] md:text-xs font-bold transition-all text-zinc-300">
                      Grok 3 <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Desktop Only) */}
        <footer className="hidden md:block py-6 text-zinc-700 text-[10px] uppercase tracking-widest font-bold text-center border-t border-zinc-900/50">
           Chaitanya Enterprise AI — Powered by Chaitanya-4781A
        </footer>
      </main>
    </div>
  );
}

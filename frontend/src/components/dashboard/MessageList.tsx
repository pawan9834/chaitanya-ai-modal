'use client';

import React from 'react';
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Volume2, Download } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image?: string;
  audio?: string;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onCopy: (content: string, id: string) => void;
  onRegenerate: () => void;
  copiedId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageList({ messages, isTyping, onCopy, onRegenerate, copiedId, messagesEndRef }: MessageListProps) {
  return (
    <div className="space-y-12 pb-20">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <div className={`max-w-[100%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full border border-[var(--border-dim)] flex items-center justify-center text-xs font-bold bg-[var(--surface)] flex-shrink-0 mt-1">
                A
              </div>
            )}
            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-4 rounded-3xl text-sm md:text-base leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                  ? 'bg-[var(--user-bubble)] text-[var(--background)] font-medium shadow-lg'
                  : 'bg-[var(--ai-bubble)] text-[var(--text-main)] border border-[var(--border-dim)] backdrop-blur-md'
                }`}>
                {msg.content}

                {msg.image && (
                  <div className="mt-4 relative group/img overflow-hidden rounded-2xl border border-[var(--border-dim)] shadow-2xl">
                    <img src={msg.image} alt="AI Generated" className="w-full max-w-sm h-64 object-cover hover:scale-105 transition-transform duration-700" />
                    <a
                      href={msg.image}
                      download={`astravex-${msg.id}.jpg`}
                      className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-xl rounded-xl text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-orange-500"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {msg.audio && (
                  <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-grow">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-orange-500 rounded-full" />
                      </div>
                      <div className="mt-2 flex justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Voice Message</span>
                      </div>
                    </div>
                    <Volume2 className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  </div>
                )}
              </div>

              {msg.role === 'assistant' && (
                <div className="flex items-center gap-6 px-2 mt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onCopy(msg.content, msg.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1"
                    title="Copy to clipboard"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={onRegenerate}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    title="Regenerate"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-medium">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex flex-col items-start group animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full border border-[var(--border-dim)] flex items-center justify-center text-xs font-bold bg-[var(--surface)] flex-shrink-0 mt-1">
              A
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[var(--ai-bubble)] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

'use client';

import React from 'react';
import { Paperclip, ChevronDown, Check, Square, Loader2, ArrowUp, Mic, X } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  models: string[];
  isModelMenuOpen: boolean;
  setIsModelMenuOpen: (val: boolean) => void;
  isRecording: boolean;
  isTyping: boolean;
  onFileClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  filePreview: string | null;
  removeFile: () => void;
  attachedFile: File | null;
  stopRecording: () => void;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  selectedModel,
  setSelectedModel,
  models,
  isModelMenuOpen,
  setIsModelMenuOpen,
  isRecording,
  isTyping,
  onFileClick,
  onFileChange,
  fileInputRef,
  filePreview,
  removeFile,
  attachedFile,
  stopRecording
}: ChatInputProps) {
  return (
    <div className="w-full flex justify-center px-4 pb-4 md:pb-8">
      <div className={`w-full max-w-3xl bg-[var(--glass-bg)] backdrop-blur-md border transition-all duration-300 p-2 rounded-3xl md:rounded-[32px] relative z-50 shadow-2xl ${isRecording ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-[var(--border-dim)] focus-within:border-[var(--text-main)]'
        }`}>

        {filePreview && (
          <div className="px-4 py-2 flex items-center animate-in fade-in slide-in-from-bottom-2">
            <div className="relative group">
              <img src={filePreview} alt="Upload preview" className="w-16 h-16 object-cover rounded-xl border border-[var(--border-dim)] shadow-xl" />
              <button
                onClick={removeFile}
                className="absolute -top-2 -right-2 bg-[var(--text-main)] text-[var(--background)] rounded-full p-1 shadow-lg hover:opacity-80 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col relative">
          {isModelMenuOpen && (
            <div className="absolute bottom-full left-4 mb-3 w-56 bg-[var(--surface)] border border-[var(--border-dim)] rounded-2xl shadow-2xl py-2 z-[200] animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
              {models.map((model) => (
                <button
                  key={model}
                  onClick={() => {
                    setSelectedModel(model);
                    setIsModelMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span>{model}</span>
                  {selectedModel === model && <Check className="w-4 h-4 text-[var(--text-main)]" />}
                </button>
              ))}
            </div>
          )}

          {isRecording ? (
            <div className="w-full p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[var(--text-muted)] font-medium text-sm animate-pulse">Recording voice...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 items-end h-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="w-1 bg-red-500/50 rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Ask anything..."
              className="w-full bg-transparent p-4 rounded-2xl text-base md:text-lg focus:outline-none placeholder-[var(--text-muted)]"
              disabled={isTyping}
            />
          )}

          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf,.txt,.docx"
                onChange={onFileChange}
              />
              <button
                onClick={onFileClick}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors disabled:opacity-30"
                disabled={isRecording || isTyping}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all relative ${isModelMenuOpen
                  ? 'bg-[var(--text-main)] text-[var(--background)]'
                  : 'bg-[var(--surface-hover)] border border-[var(--border-dim)] text-[var(--text-main)] hover:bg-[var(--border-dim)]'
                  } disabled:opacity-30`}
                disabled={isRecording || isTyping}
              >
                {selectedModel} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isModelMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all scale-110 shadow-lg flex items-center justify-center animate-pulse"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={isTyping}
                  className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${(input.trim() || attachedFile)
                    ? 'bg-[var(--text-main)] text-[var(--background)] scale-110 shadow-lg'
                    : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    } ${isTyping ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : ((input.trim() || attachedFile) ? <ArrowUp className="w-5 h-5" /> : <Mic className="w-5 h-5" />)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

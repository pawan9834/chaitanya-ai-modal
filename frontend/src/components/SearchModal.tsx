'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  MessageSquare, 
  Clock, 
  Calendar, 
  ChevronRight,
  ArrowRight,
  Loader2,
  CornerDownLeft,
  Trash2,
  Edit2
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onConversationSelect: (id: string) => void;
}

export default function SearchModal({ 
  isOpen, 
  onClose, 
  conversations, 
  onConversationSelect 
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [previewMessages, setPreviewMessages] = useState<Message[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Grouping logic
  const groupConversations = (convs: Conversation[]) => {
    const groups: { [key: string]: Conversation[] } = {
      'Today': [],
      'Yesterday': [],
      'Last 7 Days': [],
      'This Year': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    convs.forEach(conv => {
      const date = new Date(conv.updatedAt);
      if (date >= today) groups['Today'].push(conv);
      else if (date >= yesterday) groups['Yesterday'].push(conv);
      else if (date >= sevenDaysAgo) groups['Last 7 Days'].push(conv);
      else if (date >= firstDayOfYear) groups['This Year'].push(conv);
      else groups['Older'].push(conv);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedConvs = groupConversations(filteredConversations);

  useEffect(() => {
    if (selectedConvId) {
      fetchPreview(selectedConvId);
    } else {
      setPreviewMessages([]);
    }
  }, [selectedConvId]);

  const fetchPreview = async (id: string) => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/history?conversationId=${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleOpenChat = () => {
    if (selectedConvId) {
      onConversationSelect(selectedConvId);
      onClose();
    }
  };

  // Close on Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 overflow-hidden backdrop-blur-xl"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[var(--glass-bg)]" 
            onClick={onClose} 
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="hidden lg:flex w-full max-w-6xl h-full max-h-[850px] bg-[var(--background)] border border-[var(--border-dim)] rounded-3xl overflow-hidden shadow-2xl flex-col relative z-10"
          >
            {/* Top Bar / Search */}
            <div className="p-4 border-b border-[var(--border-dim)] flex items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border-dim)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--border-bright)] transition-all font-medium"
                />
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-[var(--surface-hover)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Split Content Body */}
            <div className="flex-grow flex overflow-hidden">
              {/* Left Sidebar - Conversation List */}
              <div className="w-[340px] border-r border-[var(--border-dim)] overflow-y-auto scrollbar-hide p-3 space-y-6 bg-[var(--surface)]/50">
                {groupedConvs.map(([title, items]) => (
                  <div key={title} className="space-y-2">
                    <h3 className="flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                      <Clock className="w-3.5 h-3.5" />
                      {title}
                    </h3>
                    <div className="space-y-1">
                      {items.map(conv => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`w-full text-left p-3 rounded-2xl flex flex-col gap-1.5 transition-all group relative overflow-hidden ${
                            selectedConvId === conv.id 
                              ? 'bg-[var(--surface-hover)] ring-1 ring-[var(--border-bright)]' 
                              : 'hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          <span className={`text-sm font-semibold truncate ${
                            selectedConvId === conv.id ? 'text-[var(--text-main)]' : 'text-[var(--text-main)]/70'
                          }`}>
                            {conv.title}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {selectedConvId === conv.id && (
                            <motion.div 
                              layoutId="active-pill"
                              className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--text-main)]"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center gap-4 mt-10">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
                      <Search className="w-8 h-8 text-[var(--text-muted)]/20" />
                    </div>
                    <div>
                      <p className="text-[var(--text-main)]/60 font-semibold mb-1">No results found</p>
                      <p className="text-[var(--text-muted)] text-xs">Try searching for something else</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Pane - Chat Preview */}
              <div className="flex-grow flex flex-col bg-[var(--background)]/40 relative">
                {selectedConvId ? (
                  <>
                    <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-hide scroll-smooth">
                      {isLoadingPreview ? (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-[var(--text-muted)]/20 animate-spin" />
                        </div>
                      ) : (
                        previewMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col gap-3 max-w-[85%] ${
                              msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                            }`}
                          >
                            <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-[var(--surface-hover)] border border-[var(--border-dim)] text-[var(--text-main)]/90'
                                : 'bg-transparent text-[var(--text-main)]/70 border border-[var(--border-dim)]'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bottom Action Hint */}
                    <div className="p-4 border-t border-[var(--border-dim)] flex justify-end gap-6 bg-[var(--surface)]/80 backdrop-blur-xl">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleOpenChat}>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest group-hover:text-[var(--text-main)] transition-colors">Go</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[9px] text-[var(--text-muted)] border border-[var(--border-dim)] group-hover:border-[var(--text-muted)] transition-colors flex items-center gap-1">
                            <CornerDownLeft className="w-2.5 h-2.5" />
                            ENTER
                          </kbd>
                        </div>

                        <div className="flex items-center gap-2 opacity-30 cursor-not-allowed">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Edit</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[9px] text-[var(--text-muted)] border border-[var(--border-dim)]">CTRL</kbd>
                          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[9px] text-[var(--text-muted)] border border-[var(--border-dim)]">E</kbd>
                        </div>

                        <div className="flex items-center gap-2 opacity-30 cursor-not-allowed">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Delete</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[9px] text-[var(--text-muted)] border border-[var(--border-dim)]">CTRL</kbd>
                          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[9px] text-[var(--text-muted)] border border-[var(--border-dim)]">D</kbd>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 rounded-full bg-[var(--surface-hover)] flex items-center justify-center mb-6 relative border border-[var(--border-dim)]">
                      <MessageSquare className="w-10 h-10 text-[var(--text-muted)]/20" />
                      <div className="absolute inset-0 rounded-full border border-[var(--accent)]/10 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-main)]/70 mb-2">Select a Conversation</h3>
                      <p className="text-[var(--text-muted)] max-w-sm mx-auto text-sm leading-relaxed">
                        Pick a conversation from the sidebar to preview the history and resume the chat.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

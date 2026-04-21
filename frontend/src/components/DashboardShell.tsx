'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import SearchModal from './SearchModal';
import SettingsModal from './SettingsModal';
import {
  Sparkles,
  Paperclip,
  Mic,
  ChevronDown,
  Video,
  Camera,
  AudioLines,
  FileSearch,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  Play,
  Pause,
  Volume2,
  Square,
  Check,
  X,
  Loader2
} from 'lucide-react';

export default function DashboardShell() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Model Selection State - Default to Gemini 1.5 Flash
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Flash');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastConfig, setToastConfig] = useState<{ show: boolean, message: string, type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Guest Chat Limit State
  const [guestChatCount, setGuestChatCount] = useState(0);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  useEffect(() => {
    if (user?.email === 'test@example.com') {
      const savedCount = localStorage.getItem('guest_chat_count');
      if (savedCount) setGuestChatCount(parseInt(savedCount));
    }
  }, [user]);

  const incrementGuestChatCount = () => {
    const newCount = guestChatCount + 1;
    setGuestChatCount(newCount);
    localStorage.setItem('guest_chat_count', newCount.toString());
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastConfig({ show: true, message, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, show: false }));
    }, 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conversations`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !currentConversationId) {
        if (!currentConversationId) setMessages([]);
        return;
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/history?conversationId=${currentConversationId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchHistory();
  }, [user, currentConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || isTyping) return;
    
    // Find the last user message to resend
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove last assistant message if any
    if (messages[messages.length - 1].role === 'assistant') {
      setMessages(prev => prev.slice(0, -1));
    }

    setIsTyping(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMsg.content,
          image: lastUserMsg.image,
          conversationId: currentConversationId,
          history: messages.slice(-11, -1) // Correct history without the message we are regenerating
        }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('Regeneration Error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Model Selector Options - Only Free Models
  const models = ['Gemini 1.5 Flash'];

  // File Handling Logic
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Only image files are allowed.");
      return;
    }

    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 30MB.");
      return;
    }

    setAttachedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: '',
          audio: audioUrl,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMessage]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record voice messages.");
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) {
      if (!input.trim()) startRecording();
      return;
    }

    // Enforce Guest Limit
    const isGuest = user?.email === 'test@example.com' || user?.email?.startsWith('guest_');
    if (isGuest && guestChatCount >= 2) {
      setIsLimitModalOpen(true);
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      image: filePreview || undefined,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentInput = input.trim();
    const currentImage = filePreview;

    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          image: currentImage,
          conversationId: currentConversationId,
          history: messages.slice(-10) // Send last 10 messages for context
        }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setMessages(prev => [...prev, data]);
      
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        fetchConversations(); // Refresh list to show the new conversation title
      }

      // Increment guest count on successful send
      if (user?.email === 'test@example.com') {
        incrementGuestChatCount();
      }
    } catch (err) {
      console.error('Chat Error:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error connecting to my brain. Please check your connection or API key.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--text-main)] animate-spin border-t-transparent"></div>
      </div>
    );
  }

  const handleProfileClick = () => {
    if (window.innerWidth < 1024) {
      router.push('/settings');
      setIsMobileSidebarOpen(false);
    } else {
      setIsSettingsModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--text-main)] overflow-hidden font-sans selection:bg-[var(--accent)]/30">
      {/* Universal Toast Alert */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[2000] transition-all duration-500 transform ${toastConfig.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-6 py-3 bg-[var(--surface)] border border-[var(--border-dim)] rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toastConfig.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
            {toastConfig.type === 'success' ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium pr-2">{toastConfig.message}</span>
        </div>
      </div>

      <div className="fixed inset-0 z-0 text-center pointer-events-none">
        <div className="absolute inset-0 grok-grid opacity-30"></div>
        <div className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] bg-zinc-600/5 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-1/4 -right-20 w-[40rem] h-[40rem] bg-zinc-700/5 rounded-full blur-[120px] animate-blob [animation-delay:3s]"></div>
      </div>

      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onHomeClick={() => {
          setCurrentConversationId(null);
          setMessages([]);
        }}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onConversationSelect={(id) => {
          setCurrentConversationId(id);
          setIsMobileSidebarOpen(false);
        }}
        onSearchClick={() => setIsSearchModalOpen(true)}
        onProfileClick={handleProfileClick}
        onComingSoon={() => showToast('Feature coming soon!', 'info')}
      />

      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        conversations={conversations}
        onConversationSelect={(id) => {
          setCurrentConversationId(id);
          setIsSearchModalOpen(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Guest Limit Modal */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-dim)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center mb-6 mx-auto">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-center mb-3 tracking-tight">Upgrade Your Experience</h2>
            <p className="text-[var(--text-muted)] text-center mb-8 leading-relaxed">
              You've enjoyed your 2 free guest chats. Sign in now to unlock unlimited messaging, image generation, and chat history.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/login')}
                className="w-full py-4 bg-[var(--text-main)] text-[var(--background)] rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                Sign In Now
              </button>
              <button 
                onClick={() => setIsLimitModalOpen(false)}
                className="w-full py-4 bg-transparent border border-[var(--border-dim)] text-[var(--text-muted)] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[var(--surface-hover)] transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow z-10 flex flex-col h-full relative overflow-hidden">
        <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <div className="flex-grow overflow-y-auto scrollbar-hide flex flex-col items-center">
          <div className="w-full max-w-3xl flex-grow px-4 py-8 flex flex-col">

            {messages.length === 0 && !isTyping ? (
              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="hidden md:block text-center space-y-6 mb-12">
                  <h1 className="text-6xl font-black tracking-tighter flex items-center justify-center gap-4">
                    Hello, {user.name.split(' ')[0]} <Sparkles className="w-10 h-10" />
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
                    {[
                      { icon: <Video className="w-5 h-5" />, title: "Create Videos", desc: "AI-generated motion" },
                      { icon: <Camera className="w-5 h-5" />, title: "Open Camera", desc: "Visual analysis" },
                      { icon: <AudioLines className="w-5 h-5" />, title: "Voice Mode", desc: "Real-time conversation" },
                      { icon: <FileSearch className="w-5 h-5" />, title: "Analyze docs", desc: "Data processing" },
                    ].map((action, i) => (
                      <div
                        key={i}
                        className="p-5 md:p-6 bg-[var(--surface)] border border-[var(--border-dim)] rounded-2xl transition-all cursor-not-allowed opacity-60 group w-[160px] md:w-auto overflow-hidden relative"
                      >
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-[var(--surface-hover)] border border-[var(--border-dim)] rounded-full text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Soon
                        </div>
                        <div className="text-[var(--text-muted)] mb-3 transition-colors">
                          {action.icon}
                        </div>
                        <h3 className="text-[var(--text-main)] font-bold text-xs md:text-base mb-1">{action.title}</h3>
                        <p className="text-[var(--text-muted)] text-[10px] md:text-sm">{action.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-12 pb-20">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`max-w-[100%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full border border-[var(--border-dim)] flex items-center justify-center text-xs font-bold bg-[var(--surface)] flex-shrink-0 mt-1">
                          A
                        </div>
                      )}

                      <div className="flex flex-col gap-3 w-full max-w-full">
                        {msg.content && (
                          <div className={`px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${msg.role === 'user'
                              ? 'bg-[var(--user-bubble)] text-[var(--text-main)] font-medium self-end'
                              : 'bg-[var(--ai-bubble)] text-[var(--text-main)]'
                            }`}>
                            {msg.content.split('\n').map((line: string, i: number) => (
                              <p key={i} className={line.trim() === '' ? 'h-4' : 'mb-2 last:mb-0'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        )}

                        {msg.image && (
                          <div className="mt-2 rounded-2xl overflow-hidden border border-[var(--border-dim)] shadow-2xl transition-transform hover:scale-[1.01] cursor-zoom-in">
                            <img src={msg.image} alt="AI Generated" className="w-full h-auto object-cover max-h-[400px]" />
                          </div>
                        )}

                        {msg.audio && (
                          <div className={`mt-2 p-4 bg-[var(--surface)] border border-[var(--border-dim)] rounded-2xl flex items-center gap-4 group/audio ${msg.role === 'user' ? 'ml-auto min-w-[280px]' : 'mr-auto min-w-[280px]'}`}>
                            <button className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg">
                              <Play className="w-5 h-5 fill-current" />
                            </button>
                            <div className="flex-grow min-w-0">
                              <div className="h-1 bg-[var(--border-dim)] rounded-full overflow-hidden">
                                <div className="w-0 h-full bg-[var(--accent)] opacity-50"></div>
                              </div>
                              <div className="flex justify-between mt-2 text-[10px] text-[var(--text-muted)] font-medium">
                                <span>0:00</span>
                                <span>Voice Message</span>
                              </div>
                            </div>
                            <Volume2 className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                          </div>
                        )}

                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-6 px-2 mt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1"
                              title="Copy to clipboard"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button 
                              onClick={handleRegenerate}
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
            )}
          </div>
        </div>

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
                      handleSend();
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
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={handleFileClick}
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
                      onClick={handleSend}
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
      </main>
    </div>
  );
}

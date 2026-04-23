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
  Loader2,
  Download,
  Image as ImageIcon
} from 'lucide-react';

export default function DashboardShell() {
  const { user, loading, authToken } = useAuth();
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

  // Feature States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Guest Chat Limit State
  const [guestChatCount, setGuestChatCount] = useState(0);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  useEffect(() => {
    const isGuest = user?.email === 'test@example.com' || user?.email?.startsWith('guest_');
    if (isGuest) {
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
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
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
          headers: {
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          },
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

    const isGuest = user?.email === 'test@example.com' || user?.email?.startsWith('guest_');
    if (isGuest && guestChatCount >= 2) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsTyping(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
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
  const models = [
    'Gemini 1.5 Flash',
    'Gemini 1.5 Pro',
    'Gemini 2.0 Flash',
    'Image Generator'
  ];

  // File Handling Logic
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type) || file.type === type);

    if (!isAllowed) {
      alert("Only images, PDFs, Word docs, and Text files are allowed.");
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

    const isImageMode = selectedModel === 'Image Generator';
    const body: any = {
      conversationId: currentConversationId,
    };

    if (isImageMode) {
      body.prompt = currentInput;
    } else {
      body.message = currentInput;
      body.image = currentImage;
      body.history = messages.slice(-10);
      body.modelId = selectedModel;
    }

    try {
      const endpoint = isImageMode ? '/api/generate-image' : '/api/chat';
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(body),
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
      const isGuest = user?.email === 'test@example.com' || user?.email?.startsWith('guest_');
      if (isGuest) {
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

  const handleDataCleared = () => {
    setConversations([]);
    setMessages([]);
    setCurrentConversationId(null);
    setIsSettingsModalOpen(false);
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
  // Feature Actions
  const handleAnalyzeDocs = () => {
    fileInputRef.current?.click();
  };

  const handleOpenCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setFilePreview(dataUrl);
      
      // Stop stream
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraOpen(false);
      showToast('Photo captured!', 'success');
    }
  };

  const handleVoiceMode = () => {
    setIsVoiceMode(true);
    // Simple mock pulse for beta
    showToast('Voice Mode Activated', 'info');
  };

  const handleCreateVideo = () => {
    setSelectedModel('Gemini 1.5 Pro'); // Use pro for video prompts
    setInput("Create a short cinematic video of: ");
    showToast('Video Mode: Enter your prompt', 'info');
  };
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
        onDataCleared={handleDataCleared}
      />

      {/* Guest Limit Modal */}
      {isLimitModalOpen && (
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
              </div>
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
                      { icon: <Video className="w-5 h-5" />, title: "Create Videos", desc: "AI-generated motion", action: handleCreateVideo },
                      { icon: <Camera className="w-5 h-5" />, title: "Open Camera", desc: "Visual analysis", action: handleOpenCamera },
                      { icon: <AudioLines className="w-5 h-5" />, title: "Voice Mode", desc: "Real-time conversation", action: handleVoiceMode },
                      { icon: <FileSearch className="w-5 h-5" />, title: "Analyze docs", desc: "Data processing", action: handleAnalyzeDocs },
                    ].map((action, i) => (
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
                            <img src={msg.image} alt="User Upload" className="w-full h-auto object-cover max-h-[400px]" />
                          </div>
                        )}

                        {msg.generatedImage && (
                          <div className="mt-2 rounded-3xl overflow-hidden border border-[var(--border-dim)] shadow-2xl relative group/image max-w-full">
                            <img src={msg.generatedImage} alt="AI Generation" className="w-full h-auto object-cover max-h-[600px] bg-[var(--surface)]" />
                            <a 
                              href={msg.generatedImage} 
                              download="astravex-art.png" 
                              target="_blank" 
                              rel="noreferrer"
                              className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white opacity-100 lg:opacity-0 group-hover/image:opacity-100 transition-all hover:bg-black/60 shadow-xl"
                            >
                              <Download className="w-5 h-5" />
                            </a>
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
                    accept="image/*,.pdf,.txt,.docx"
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

      {/* Camera Capture Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
            <h2 className="text-white text-lg font-black tracking-tighter uppercase">AI Vision</h2>
            <button onClick={() => setIsCameraOpen(false)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-12 z-30">
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full border-4 border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full border-2 border-black/10" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Mode Pulse Overlay */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-[2000] bg-[var(--background)]/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
          <button onClick={() => setIsVoiceMode(false)} className="absolute top-8 right-8 p-3 bg-[var(--surface-hover)] rounded-2xl text-[var(--text-main)]">
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
      )}
    </div>
  );
}

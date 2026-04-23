'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import SearchModal from './SearchModal';
import SettingsModal from './SettingsModal';
import ActionCards from './dashboard/ActionCards';
import MessageList from './dashboard/MessageList';
import ChatInput from './dashboard/ChatInput';
import CameraOverlay from './dashboard/CameraOverlay';
import VoiceOverlay from './dashboard/VoiceOverlay';
import GuestLimitModal from './dashboard/GuestLimitModal';
import {
  Check,
  Sparkles
} from 'lucide-react';

export default function DashboardShell() {
  const { user, loading, authToken } = useAuth();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Model Selection State - Default to AstraVex Flash
  const [selectedModel, setSelectedModel] = useState('AstraVex - Flash');
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

  // Model Selector Options - AstraVex Branded
  const models = [
    'AstraVex - Flash',
    'AstraVex - Pro',
    'AstraVex - Ultra',
    'AstraVex - Image Art'
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

    const isImageMode = selectedModel === 'AstraVex - Image Art';
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
    showToast('Voice Mode Activated', 'info');
  };

  const handleCreateVideo = () => {
    setSelectedModel('AstraVex - Pro');
    setInput("Create a short cinematic video of: ");
    showToast('Video Mode: Enter your prompt', 'info');
  };

  const handleProfileClick = () => {
    if (window.innerWidth < 1024) {
      router.push('/settings');
      setIsMobileSidebarOpen(false);
    } else {
      setIsSettingsModalOpen(true);
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

      <div className="flex-grow flex flex-col min-w-0 h-full relative">
        <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-grow z-10 flex flex-col h-full relative overflow-hidden">
          <div className="flex-grow overflow-y-auto scrollbar-hide flex flex-col items-center">
            <div className="w-full max-w-3xl flex-grow px-4 py-8 flex flex-col">
              {messages.length === 0 && !isTyping ? (
                <ActionCards
                  userName={user?.name?.split(' ')[0] || 'User'}
                  onVideo={handleCreateVideo}
                  onCamera={handleOpenCamera}
                  onVoice={handleVoiceMode}
                  onAnalyze={handleAnalyzeDocs}
                />
              ) : (
                <MessageList
                  messages={messages}
                  isTyping={isTyping}
                  onCopy={copyToClipboard}
                  onRegenerate={handleRegenerate}
                  copiedId={copiedId}
                  messagesEndRef={messagesEndRef}
                />
              )}
            </div>
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            models={models}
            isModelMenuOpen={isModelMenuOpen}
            setIsModelMenuOpen={setIsModelMenuOpen}
            isRecording={isRecording}
            isTyping={isTyping}
            onFileClick={handleFileClick}
            onFileChange={handleFileChange}
            fileInputRef={fileInputRef}
            filePreview={filePreview}
            removeFile={removeFile}
            attachedFile={attachedFile}
            stopRecording={stopRecording}
          />
        </main>
      </div>

      <CameraOverlay
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={capturePhoto}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />

      <VoiceOverlay
        isOpen={isVoiceMode}
        onClose={() => setIsVoiceMode(false)}
      />

      <GuestLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
      />
    </div>
  );
}

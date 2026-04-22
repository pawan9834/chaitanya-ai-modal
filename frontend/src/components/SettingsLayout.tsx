'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Wand2,
  MousePointer2,
  Sliders,
  Database,
  Zap,
  Globe,
  Languages,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export type Category = 'Account' | 'Appearance' | 'Behavior' | 'Customize' | 'Data Controls' | 'Legal';

interface SettingsLayoutProps {
  isMobile?: boolean;
  onDataCleared?: () => void;
}

export default function SettingsLayout({ isMobile = false, onDataCleared }: SettingsLayoutProps) {
  const { user, authToken, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<Category>('Account');
  const [confirming, setConfirming] = useState<null | 'conversations' | 'media' | 'account'>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAction = async (type: 'conversations' | 'media' | 'account') => {
    setIsDeleting(true);
    try {
      const endpoint = type === 'conversations' ? '/api/user/delete-conversations' :
                       type === 'media' ? '/api/user/delete-media' :
                       '/api/user/delete-account';

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        credentials: 'include'
      });

      if (res.ok) {
        if (type === 'account') {
          await logout();
          window.location.href = '/login';
        } else {
          setConfirming(null);
          if (type === 'conversations' && onDataCleared) {
            onDataCleared();
          } else {
            alert(`Successfully deleted all ${type === 'media' ? 'media' : 'data'}.`);
          }
        }
      } else {
        alert('Failed to process deletion. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    { id: 'Account' as Category, icon: <User className="w-5 h-5" />, label: 'Account' },
    { id: 'Appearance' as Category, icon: <Wand2 className="w-5 h-5" />, label: 'Appearance' },
    { id: 'Behavior' as Category, icon: <MousePointer2 className="w-5 h-5" />, label: 'Behavior' },
    { id: 'Customize' as Category, icon: <Sliders className="w-5 h-5" />, label: 'Customize' },
    { id: 'Data Controls' as Category, icon: <Database className="w-5 h-5" />, label: 'Data Controls' },
    { id: 'Legal' as Category, icon: <ShieldCheck className="w-5 h-5" />, label: 'Legal' },
  ];

  const renderContent = () => {
    switch (activeCategory) {
      case 'Account':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* User Profile Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[var(--surface-hover)] border border-[var(--border-dim)] flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                {user?.picture ? (
                  <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-[var(--text-muted)] opacity-50" />
                )}
              </div>
              <div className="flex-grow text-center sm:text-left">
                <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-0.5">
                  {user?.name || 'User'}
                </h3>
                <p className="text-[var(--text-muted)] text-sm font-medium">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <button className="px-5 py-2.5 bg-black/5 border border-[var(--border-dim)] rounded-full text-[10px] font-black text-[var(--text-muted)] cursor-not-allowed uppercase tracking-widest">
                Coming Soon
              </button>
            </div>



            {/* Multi-line Settings */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--text-main)]">Language</span>
                  <Languages className="w-4 h-4 text-[var(--text-muted)] opacity-50" />
                </div>
                <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-[10px] uppercase tracking-[0.2em] px-5 py-2 bg-[var(--surface-hover)] border border-[var(--border-dim)] rounded-full transition-all">Change</button>
              </div>

              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--text-main)]">Birth Year</span>
                  <span className="text-sm text-[var(--text-muted)] font-black ml-1">1997</span>
                </div>
                <button className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em] px-5 py-2 bg-[var(--surface-hover)] border border-[var(--border-dim)] rounded-full cursor-not-allowed opacity-50">Coming Soon</button>
              </div>
            </div>

            <div className="pt-20 text-center">
              <p className="text-[9px] font-black tracking-[0.3em] text-[var(--text-muted)]/20 uppercase select-all">
                41686e94-79a3-49db-82d0-e66ce51c910d
              </p>
            </div>
          </div>
        );
      case 'Data Controls':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-2">Manage your data</h3>
              <p className="text-[var(--text-muted)] text-sm mb-8">Take control of your privacy and platform data.</p>
            </div>
            
            {[
              {
                id: 'conversations',
                title: 'Delete All Conversations',
                desc: 'Instantly wipe your entire chat history and memory.',
                icon: <MessageSquare className="w-5 h-5" />,
                action: 'Delete Conversations',
                danger: false
              },
              {
                id: 'media',
                title: 'Delete All Imagine Media',
                desc: 'Remove all AI-generated images and video assets.',
                icon: <Zap className="w-5 h-5" />,
                action: 'Delete Media',
                danger: false
              },
              {
                id: 'account',
                title: 'Delete Account',
                desc: 'Permanently remove your identity and all associated data from AstraVex. This cannot be undone.',
                icon: <User className="w-5 h-5" />,
                action: 'Delete Account',
                danger: true
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="p-6 bg-[var(--surface)] border border-[var(--border-dim)] rounded-[2rem] flex flex-col gap-6 group hover:border-[var(--border-bright)] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-dim)] ${item.danger ? 'text-red-500/50 font-bold' : 'text-[var(--text-muted)]'}`}>
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[var(--text-main)]">{item.title}</h4>
                    <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setConfirming(item.id as any)}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black border transition-all uppercase tracking-widest ${
                    item.danger 
                      ? 'border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500' 
                      : 'border-[var(--border-dim)] bg-[var(--surface-hover)] text-[var(--text-main)] hover:border-[var(--border-bright)]'
                  }`}
                >
                  {item.action}
                </button>
              </div>
            ))}

            {/* Confirmation Overlay */}
            {confirming && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-dim)] rounded-[2.5rem] p-8 shadow-2xl space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                       {confirming === 'conversations' ? <MessageSquare className="w-8 h-8" /> : confirming === 'media' ? <Zap className="w-8 h-8" /> : <User className="w-8 h-8" />}
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Confirm Deletion</h3>
                    <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                      Are you absolutely sure you want to delete {confirming === 'account' ? 'your entire account' : confirming === 'conversations' ? 'all conversations' : 'all media assets'}? This action is permanent and cannot be reversed.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={() => handleAction(confirming)}
                      disabled={isDeleting}
                      className="w-full py-4 rounded-2xl bg-red-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      {isDeleting ? 'Processing...' : 'Confirm Delete'}
                    </button>
                    <button 
                      onClick={() => setConfirming(null)}
                      disabled={isDeleting}
                      className="w-full py-4 rounded-2xl border border-[var(--border-dim)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:bg-[var(--surface-hover)] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        );
      case 'Legal':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-2">Legal Information</h3>
              <p className="text-[var(--text-muted)] text-sm mb-8">Review our policies and terms of service.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Link href="/terms" className="p-6 bg-[var(--surface)] border border-[var(--border-dim)] rounded-3xl flex items-center justify-between group hover:border-orange-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">Terms of Service</h4>
                    <p className="text-[var(--text-muted)] text-xs">Agreement for using AstraVex.</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
              </Link>

              <Link href="/privacy" className="p-6 bg-[var(--surface)] border border-[var(--border-dim)] rounded-3xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">Privacy Policy</h4>
                    <p className="text-[var(--text-muted)] text-xs">How we protect your data.</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500 transition-colors" />
              </Link>
            </div>

            <div className="pt-10 text-center">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                Version 1.0.4-ASTRA
              </p>
            </div>
          </div>
        );
      case 'Appearance':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6">Theme</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'light', icon: <Sun className="w-5 h-5" />, label: 'Light' },
                  { id: 'dark', icon: <Moon className="w-5 h-5" />, label: 'Dark' },
                  { id: 'system', icon: <Monitor className="w-5 h-5" />, label: 'System' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`p-6 bg-[var(--surface)] border-2 rounded-3xl flex flex-col items-center gap-4 transition-all ${theme === t.id
                        ? 'border-[var(--text-main)] bg-[var(--surface-hover)]'
                        : 'border-[var(--border-dim)] hover:border-[var(--border-bright)]'
                      }`}
                  >
                    <div className={`${theme === t.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                      {t.icon}
                    </div>
                    <span className={`text-sm font-bold ${theme === t.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-2">Accessibility</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">Make AstraVex easier to see and use.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm font-bold text-[var(--text-main)]">High Contrast</span>
                  <div className="w-10 h-5 bg-[var(--surface-hover)] border border-[var(--border-dim)] rounded-full relative cursor-not-allowed opacity-50">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-[var(--text-muted)] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-3xl bg-[var(--surface-hover)] flex items-center justify-center mb-6">
              {categories.find(c => c.id === activeCategory)?.icon}
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]/80 mb-2">{activeCategory} Settings</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto">
              Customization for {activeCategory.toLowerCase()} is coming soon to AstraVex.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-grow overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
      {/* Sidebar - Categories */}
      <div className={`${isMobile ? 'w-full border-b flex overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide py-2 px-1' : 'w-[280px] border-r overflow-y-auto scrollbar-hide p-4 space-y-1'} border-[var(--border-dim)] bg-[var(--surface)]/50`}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`${isMobile ? 'inline-flex flex-col items-center justify-center px-4 py-2 min-w-[80px]' : 'w-full text-left p-4 rounded-2xl flex items-center gap-4'} transition-all group relative overflow-hidden ${activeCategory === cat.id
                ? 'bg-[var(--surface-hover)] ring-1 ring-[var(--border-bright)]'
                : 'hover:bg-[var(--surface-hover)]'
              }`}
          >
            <div className={`transition-colors ${activeCategory === cat.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'} ${isMobile ? 'mb-1' : 'p-1.5 rounded-lg'}`}>
              {cat.icon}
            </div>
            <span className={`text-[10px] md:text-sm font-bold tracking-tight transition-colors ${activeCategory === cat.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
              {cat.label}
            </span>

            {activeCategory === cat.id && (
              <motion.div
                layoutId="active-cat-pill"
                className={`absolute bg-[var(--text-main)] rounded-full ${isMobile ? 'bottom-0 left-4 right-4 h-0.5' : 'left-0 top-3 bottom-3 w-1'}`}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Pane */}
      <div className={`flex-grow overflow-y-auto scrollbar-hide bg-black/10 ${isMobile ? 'p-6' : 'p-10'}`}>
        <div className="max-w-2xl mx-auto h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

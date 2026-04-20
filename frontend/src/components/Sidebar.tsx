'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Search,
  Bell,
  Mail,
  Users,
  User,
  Settings,
  Sparkles,
  LogOut,
  MoreHorizontal,
  ChevronRight,
  Clock,
  FileText,
  LifeBuoy,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { icon: <Home className="w-5 h-5 flex-shrink-0" />, label: 'Home' },
    { icon: <Search className="w-5 h-5 flex-shrink-0" />, label: 'Explore' },
    { icon: <Bell className="w-5 h-5 flex-shrink-0" />, label: 'Notifications' },
    { icon: <Mail className="w-5 h-5 flex-shrink-0" />, label: 'Messages' },
    { icon: <Sparkles className="w-5 h-5 flex-shrink-0" />, label: 'Grok' },
    { icon: <Users className="w-5 h-5 flex-shrink-0" />, label: 'Communities' },
    { icon: <User className="w-5 h-5 flex-shrink-0" />, label: 'Profile' },
  ];

  const profileMenuItems = [
    { icon: <Settings className="w-4 h-4" />, label: 'Settings' },
    { icon: <Clock className="w-4 h-4" />, label: 'Tasks' },
    { icon: <FileText className="w-4 h-4" />, label: 'Files' },
    { icon: <LifeBuoy className="w-4 h-4" />, label: 'Help', hasChevron: true },
    { icon: <Zap className="w-4 h-4" />, label: 'Upgrade plan' },
    { icon: <LogOut className="w-4 h-4" />, label: 'Sign Out', isDanger: true },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUser(null);
    router.push('/login');
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleProfileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        />
      )}

      <aside
        onClick={onClose ? undefined : toggleSidebar}
        className={`h-screen flex flex-col bg-black border-r border-zinc-900 transition-all duration-300 ease-in-out z-50 
          /* Mobile Overrides */
          fixed inset-y-0 left-0 transform lg:relative lg:translate-x-0
          ${mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:flex'}
          /* Desktop Width Logic */
          ${!mobileOpen && (isExpanded ? 'lg:w-[256px]' : 'lg:w-[56px]')}
          ${!mobileOpen && 'cursor-pointer'}
        `}
      >
        {/* Brand Logo Area */}
        <div className={`flex items-center p-4 mb-4 ${isExpanded || mobileOpen ? 'justify-between px-5' : 'justify-center'}`}>
          <div className="w-6 h-6 border border-white flex items-center justify-center font-black text-sm flex-shrink-0">
            C
          </div>
          
          {/* Mobile Close Button */}
          {mobileOpen && (
            <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-grow space-y-1 px-2 overflow-hidden">
          {navItems.map((item, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
              className={`flex items-center text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-lg transition-all cursor-pointer group h-10 
                ${isExpanded || mobileOpen ? 'px-3 justify-start' : 'justify-center'}`}
              title={!isExpanded && !mobileOpen ? item.label : undefined}
            >
              {item.icon}
              {(isExpanded || mobileOpen) && (
                <span className="ml-4 text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}

              {/* Tooltip (Only when collapsed on desktop) */}
              {!isExpanded && !mobileOpen && (
                <span className="absolute left-14 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col space-y-2 pb-6 px-2">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-lg transition-all cursor-pointer h-10 
              ${isExpanded || mobileOpen ? 'px-3 justify-start' : 'justify-center'}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {(isExpanded || mobileOpen) && (
              <span className="ml-4 text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                Settings
              </span>
            )}
          </div>

          {/* User Account Section */}
          <div
            ref={menuRef}
            onClick={toggleProfileMenu}
            className={`flex items-center py-2 transition-all cursor-pointer rounded-lg hover:bg-zinc-900/50 relative 
              ${isExpanded || mobileOpen ? 'px-3' : 'justify-center'}`}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold border border-zinc-700 flex-shrink-0 overflow-hidden">
              {user?.name?.charAt(0) || <User className="w-4 h-4" />}
            </div>

            {(isExpanded || mobileOpen) && (
              <div className="ml-3 overflow-visible animate-in fade-in slide-in-from-left-2 duration-300">
                <p className="text-white text-xs font-bold truncate w-32">{user?.name || 'Guest'}</p>
                <p className="text-zinc-500 text-[10px] truncate w-32">{user?.email}</p>
              </div>
            )}

            {(isExpanded || mobileOpen) && <MoreHorizontal className="w-4 h-4 ml-auto text-zinc-500" />}

            {/* Clickable Profile Menu */}
            {isProfileMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-full left-0 w-[240px] mb-2 bg-[#262626] border border-zinc-800 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-bottom-left"
              >
                {profileMenuItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.isDanger) handleLogout();
                      setIsProfileMenuOpen(false);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-zinc-800/50 group ${item.isDanger ? 'text-zinc-400 hover:text-white' : 'text-white'}`}
                  >
                    <span className="text-zinc-400 group-hover:text-white transition-colors mr-3">
                      {item.icon}
                    </span>
                    <span className="font-medium flex-grow text-left">{item.label}</span>
                    {item.hasChevron && <ChevronRight className="w-4 h-4 text-zinc-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

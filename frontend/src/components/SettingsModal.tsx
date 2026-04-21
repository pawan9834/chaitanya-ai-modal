'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import SettingsLayout from './SettingsLayout';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
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
          className="fixed inset-0 z-[1000] hidden lg:flex items-center justify-center p-8 overflow-hidden backdrop-blur-xl"
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
            className="w-full max-w-5xl h-full max-h-[750px] bg-[var(--background)] border border-[var(--border-dim)] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-10"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-[var(--border-dim)] flex items-center justify-between bg-[var(--surface)]/30">
              <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Settings</h2>
              <button
                onClick={onClose}
                className="p-3 hover:bg-[var(--surface-hover)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Body */}
            <SettingsLayout />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

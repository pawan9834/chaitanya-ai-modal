'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Eye, Database, Share2, Lock, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us, including your name, email address, and the content of your conversations with AstraVex. We also collect technical data such as IP addresses and browser information to ensure service stability."
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "2. How We Use Data",
      content: "We use your data to provide, maintain, and improve AstraVex. Your chat history helps our models understand context and deliver more relevant responses. We do not sell your personal data to advertisers."
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "3. Data Sharing",
      content: "We share data with infrastructure partners like Firebase (Google) for data storage and Google Gemini for AI processing. These partners are strictly required to use your data only as necessary to provide these services."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "4. Data Security",
      content: "We implement industry-standard encryption and security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "5. Your Rights",
      content: "You have the right to access, update, or delete your personal data. You can wipe your entire conversation history at any time through the 'Data Controls' section in your account settings."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans selection:bg-[var(--text-main)] selection:text-[var(--background)] overflow-x-hidden relative transition-colors duration-500">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent"></div>
        <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <Link 
          href="/login"
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-12 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Login</span>
        </Link>

        <header className="mb-20">
          <div className="w-12 h-12 border-2 border-[var(--text-main)] flex items-center justify-center font-black text-2xl mb-8">A</div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            Privacy <span className="text-blue-500">Policy</span>
          </h1>
          <p className="text-[var(--text-muted)] text-lg font-medium max-w-2xl">
            At AstraVex, we believe privacy is a fundamental human right. Here is how we protect your digital footprint.
          </p>
        </header>

        <div className="space-y-16">
          {sections.map((section, idx) => (
            <div key={idx} className="group flex gap-6 md:gap-10">
              <div className="hidden md:flex flex-col items-center">
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-dim)] text-blue-500 group-hover:scale-110 transition-transform shadow-xl shadow-blue-500/5">
                  {section.icon}
                </div>
                {idx !== sections.length - 1 && <div className="w-px flex-grow bg-gradient-to-b from-[var(--border-dim)] to-transparent mt-4"></div>}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">{section.title}</h3>
                <p className="text-[var(--text-muted)] leading-relaxed text-lg font-medium">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-32 pt-12 border-t border-[var(--border-dim)] flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[var(--text-muted)] text-sm font-medium">
            © 2026 AstraVex AI. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link href="/terms" className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-blue-500 transition-colors">Terms of Service</Link>
            <a href="mailto:privacy@astravex.ai" className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-blue-500 transition-colors">Contact Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

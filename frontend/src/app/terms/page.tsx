'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Scale, Shield, Landmark, Gavel, Cpu } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      icon: <Scale className="w-6 h-6" />,
      title: "1. Acceptance of Terms",
      content: "By accessing or using AstraVex, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services. These terms constitute a legally binding agreement between you and AstraVex."
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "2. AI Service Provision",
      content: "AstraVex provides AI-powered assistance and content generation. You acknowledge that AI-generated content may be inaccurate, incomplete, or biased. You should independently verify any outputs before relying on them for critical decisions."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "3. User Conduct",
      content: "You are responsible for your use of the service and any content you provide. You agree not to use AstraVex for illegal purposes, to generate harmful content, or to attempt to reverse-engineer our AI models."
    },
    {
      icon: <Landmark className="w-6 h-6" />,
      title: "4. Intellectual Property",
      content: "AstraVex and its original content, features, and functionality are owned by AstraVex and are protected by international copyright, trademark, and other intellectual property laws."
    },
    {
      icon: <Gavel className="w-6 h-6" />,
      title: "5. Limitation of Liability",
      content: "To the maximum extent permitted by law, AstraVex shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans selection:bg-[var(--text-main)] selection:text-[var(--background)] overflow-x-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-orange-500/5 to-transparent"></div>
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full"></div>
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
            Terms of <span className="text-orange-500">Service</span>
          </h1>
          <p className="text-[var(--text-muted)] text-lg font-medium max-w-2xl">
            Last updated: April 22, 2026. Please read these terms carefully before exploring the AstraVex universe.
          </p>
        </header>

        <div className="space-y-16">
          {sections.map((section, idx) => (
            <div key={idx} className="group flex gap-6 md:gap-10">
              <div className="hidden md:flex flex-col items-center">
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-dim)] text-orange-500 group-hover:scale-110 transition-transform shadow-xl shadow-orange-500/5">
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
            <Link href="/privacy" className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-orange-500 transition-colors">Privacy Policy</Link>
            <a href="mailto:legal@astravex.ai" className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-orange-500 transition-colors">Contact Legal</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

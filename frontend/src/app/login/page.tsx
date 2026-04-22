'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Briefcase, Globe, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
  </svg>
);

type Step = 'email' | 'otp' | 'profile';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setAuthToken, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      if (res.ok) setStep('otp');
      else {
        const data = await res.json();
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) { setError('Connection error'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) setAuthToken(data.token);
        if (data.registered) {
          setUser(data.user);
          router.push('/');
        } else { setStep('profile'); }
      } else { setError(data.message || 'Invalid OTP'); }
    } catch (err) { setError('Connection error'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, profession }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) setAuthToken(data.token);
        setUser(data.user);
        router.push('/');
      } else { setError(data.message || 'Registration failed'); }
    } catch (err) { setError('Connection error'); }
    finally { setLoading(false); }
  };

  const onGoogleLogin = async () => {
    await loginWithGoogle();
    router.push('/');
  };

  const handleEasyLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/guest-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) setAuthToken(data.token);
        setUser(data.user);
        router.push('/');
      } else {
        setError(data.message || 'Guest session failed');
      }
    } catch (err: any) {
      setError(`Connection Error: ${err.message || 'Unknown'}. URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans selection:bg-[var(--text-main)] selection:text-[var(--background)] overflow-hidden relative transition-colors duration-300">
      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 z-0">
        {/* Subtle Grid */}
        <div className="absolute inset-0 grok-grid opacity-30"></div>

        {/* Animated Orbs */}
        <div className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] bg-zinc-600/5 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-[45rem] h-[45rem] bg-zinc-700/5 rounded-full blur-[120px] animate-blob [animation-delay:2s]"></div>
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[50rem] h-[40rem] bg-zinc-600/5 rounded-full blur-[130px] animate-blob [animation-delay:4s]"></div>

        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[var(--background)] opacity-60 pointer-events-none"></div>
      </div>

      <div className="relative z-10 flex flex-col w-full max-w-lg mx-auto px-6 py-10 justify-center">
        {/* Minimal Logo */}
        <div className="flex justify-center mb-16">
          <div className="w-12 h-12 border-2 border-[var(--text-main)] flex items-center justify-center font-black text-2xl tracking-tighter hover:bg-[var(--text-main)] hover:text-[var(--background)] transition-all duration-500 cursor-default">
            A
          </div>
        </div>

        <div className="space-y-2 mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            {step === 'email' && 'Sign in to AstraVex'}
            {step === 'otp' && 'Verify your identity'}
            {step === 'profile' && 'Complete your profile'}
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            {step === 'email' && 'Modern AI for a new generation.'}
            {step === 'otp' && `We sent a code to ${email}`}
            {step === 'profile' && 'Tell us who you are.'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-[var(--surface)] border border-red-500/20 text-red-500 text-sm rounded-xl animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  className="w-full grok-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={loading} className="w-full grok-button-primary flex items-center justify-center gap-2 group">
                  {loading ? 'Processing...' : 'Next'}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                  className="w-full grok-input text-center tracking-[0.5em] text-xl font-mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button type="submit" disabled={loading} className="w-full grok-button-primary">
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </form>
            )}

            {step === 'profile' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  className="w-full grok-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Profession"
                  required
                  className="w-full grok-input"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
                <button type="submit" disabled={loading} className="w-full grok-button-primary">
                  {loading ? 'Saving...' : 'Enter AstraVex'}
                </button>
              </form>
            )}
          </div>

          {step === 'email' && (
            <div className="pt-4">
              <button
                onClick={handleEasyLogin}
                disabled={loading}
                className="w-full py-4 border border-dashed border-[var(--border-dim)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition-all flex items-center justify-center gap-2 group text-xs font-bold uppercase tracking-widest"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                Try as Guest
              </button>
            </div>
          )}

          {step !== 'email' && (
            <button
              onClick={() => setStep('email')}
              className="w-full flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-xs py-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Change email
            </button>
          )}
        </div>

        <footer className="mt-24 text-center">
          <p className="text-[var(--text-muted)] text-[10px] leading-relaxed max-w-xs mx-auto">
            By signing in, you agree to our <Link href="/terms" className="text-[var(--text-main)] underline cursor-pointer font-medium hover:text-orange-500 transition-colors">Terms</Link> and <Link href="/privacy" className="text-[var(--text-main)] underline cursor-pointer font-medium hover:text-orange-500 transition-colors">Privacy Policy</Link>.
          </p>
        </footer>
      </div>
    </div>
  );
}

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, User as FirebaseUser, signInWithCredential, GoogleAuthProvider as FirebaseGoogleAuthProvider } from 'firebase/auth';
import Cookies from 'js-cookie';
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

interface User {
  email: string;
  name: string;
  profession: string;
  dob?: string;
  picture?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authToken: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = Cookies.get('token') || localStorage.getItem('token');
    return (token === 'null' || token === 'undefined' || !token) ? null : token;
  });
  
  const setAuthToken = (token: string | null) => {
    // Basic sanitization
    const sanitizedToken = (token === 'null' || token === 'undefined' || !token) ? null : token;
    
    setAuthTokenState(sanitizedToken);
    
    if (sanitizedToken) {
      Cookies.set('token', sanitizedToken, { expires: 7, sameSite: 'Lax' });
      localStorage.setItem('token', sanitizedToken);
    } else {
      Cookies.remove('token');
      localStorage.removeItem('token');
    }
  };
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const loginWithGoogle = async () => {
    try {
      let idToken: string | undefined;

      if (Capacitor.isNativePlatform()) {
        // Initialize the plugin with your Web Client ID
        await GoogleSignIn.initialize({
          clientId: '176531876007-qhf2afne5m6ff2qhp7m5830bafj82t98.apps.googleusercontent.com',
        });

        const result = await GoogleSignIn.signIn();
        idToken = result.idToken;
        
        // SYNC WITH FIREBASE: Create a credential from the native token and sign in locally
        const credential = FirebaseGoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      }

      if (!idToken) throw new Error('Failed to obtain ID Token');
      
      // Send token to backend to create session
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.token) {
          setAuthToken(data.token);
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      if (Capacitor.isNativePlatform()) {
        alert('Native Google Error: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  const logout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, { 
      method: 'POST',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      credentials: 'include'
    });
    setUser(null);
    setAuthToken(null);
    Cookies.remove('token');
    auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, authToken, loginWithGoogle, logout, setUser, setAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

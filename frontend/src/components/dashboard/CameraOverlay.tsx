'use client';

import React from 'react';
import { X } from 'lucide-react';

interface CameraOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function CameraOverlay({ isOpen, onClose, onCapture, videoRef, canvasRef }: CameraOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white text-lg font-black tracking-tighter uppercase">AI Vision</h2>
        <button onClick={onClose} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-12 z-30">
        <button 
          onClick={onCapture}
          className="w-20 h-20 bg-white rounded-full border-4 border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full border-2 border-black/10" />
        </button>
      </div>
    </div>
  );
}

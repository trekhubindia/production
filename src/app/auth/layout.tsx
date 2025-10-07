import React from 'react';
import Navbar from '@/components/Navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#111111] flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Left: Card Area (children) */}
        {children}
        {/* Right: Live Video BG (desktop only) */}
        <div className="hidden md:flex-1 md:flex md:items-center md:justify-center md:relative md:overflow-hidden md:bg-[#111]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/images/testbg1.mp4"
          />
          <div className="absolute inset-0 z-10 pointer-events-none" style={{background: 'linear-gradient(to right, #111 0%, rgba(17,17,17,0.7) 30%, rgba(17,17,17,0.3) 60%, transparent 100%)'}} />
        </div>
      </div>
    </div>
  );
} 
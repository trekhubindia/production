/* eslint-disable */
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [cardFade, setCardFade] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.status === 429 && data.cooldown) {
        setCooldown(data.cooldown);
        setError(data.message || 'Please wait before trying again.');
      } else if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Animate card in on mount
  React.useEffect(() => {
    setCardFade(false);
  }, []);

  const handleBackToSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setCardFade(true);
    setTimeout(() => {
      router.push('/auth');
    }, 300); // match transition duration
  };

  return (
    <div className="flex flex-col justify-center items-center w-full max-w-2xl px-8 py-12 bg-[#111] shadow-none z-10">
      <div className={`w-full max-w-md flex flex-col items-center justify-center transition-opacity duration-300 ${cardFade ? 'opacity-0' : 'opacity-100'}`}>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8 text-center">Forgot your password?</h2>
        {message && <p className="text-[#00e676] text-center mb-4">{message}</p>}
        {error && <p className="text-red-500 text-center mb-4">{error}{cooldown > 0 && ` (${cooldown}s)`}</p>}
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Mail size={18} /></span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || cooldown > 0}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-800 bg-[#222] text-white focus:border-[#00e676] focus:bg-[#181818] focus:outline-none transition-all placeholder-gray-400 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className={`w-full py-3 rounded-lg bg-[#00e676] hover:bg-[#00bfae] text-black font-bold text-base shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00e676] focus:ring-offset-2 ${loading || cooldown > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : cooldown > 0 ? `Wait (${cooldown}s)` : 'Send reset link'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="/auth" onClick={handleBackToSignIn} className="text-[#00e676] hover:text-[#00bfae] text-sm flex items-center justify-center font-semibold transition-colors duration-200 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
} 
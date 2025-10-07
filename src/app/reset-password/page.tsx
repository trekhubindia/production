/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { Suspense } from 'react';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    if (message && !isMobile) {
      // Desktop: start countdown
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Try to close the window
            window.close();
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [message, isMobile]);

  useEffect(() => {
    if (message && !isMobile) {
      setCountdown(5);
      let count = 5;
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count < 0) {
          clearInterval(timer);
          // Send credentials to opener and close the window
          if (window.opener && resetEmail && resetPassword) {
            window.opener.postMessage({ type: 'reset-login', email: resetEmail, password: resetPassword }, window.location.origin);
          }
          window.close();
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [message, isMobile, resetEmail, resetPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setResetPassword(password); // Store new password for postMessage
        setResetEmail(''); // We'll set this below if possible
        // Try to get email from token (not available here), so ask user to enter email again if needed
        // Redirect/auto-login will only work if email is available
        setTimeout(() => {
          setResetEmail('');
        }, 0);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="inline-flex items-center text-sm text-green-600 hover:text-green-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#111111] flex">
      {/* Left: Reset Password Card */}
      <div className="flex flex-col justify-center items-center w-full max-w-2xl px-8 py-12 bg-[#111] shadow-none z-10">
        <div className="w-full max-w-md flex flex-col items-center justify-center transition-opacity duration-300">
          {message ? (
            <div className="w-full flex flex-col items-center justify-center py-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 text-center">Password reset successful!</h2>
              {!isMobile ? (
                <>
                  <p className="text-[#00e676] text-center mb-4 text-lg">This page will automatically close in <span className="font-bold">{countdown}</span>...<br/>Please login with your new credentials.</p>
                </>
              ) : (
                <>
                  <p className="text-[#00e676] text-center mb-4 text-lg">Please sign in with your new password.</p>
                  <button
                    onClick={() => router.push('/auth')}
                    className="mt-6 w-full py-3 rounded-lg bg-[#00e676] hover:bg-[#00bfae] text-black font-bold text-base shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00e676] focus:ring-offset-2"
                  >
                    Go to Sign In
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8 text-center">Reset your password</h2>
              {error && <p className="text-red-500 text-center mb-4">{error}</p>}
              <form className="space-y-6 w-full" onSubmit={handleSubmit}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={18} /></span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-800 bg-[#222] text-white focus:border-[#00e676] focus:bg-[#181818] focus:outline-none transition-all placeholder-gray-400 sm:text-sm"
                    placeholder="New password"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00e676] focus:outline-none">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={18} /></span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-800 bg-[#222] text-white focus:border-[#00e676] focus:bg-[#181818] focus:outline-none transition-all placeholder-gray-400 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00e676] focus:outline-none">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg bg-[#00e676] hover:bg-[#00bfae] text-black font-bold text-base shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00e676] focus:ring-offset-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {/* Right: Live Video BG (desktop only) */}
      <div className="hidden md:flex-1 md:flex md:items-center md:justify-center md:relative md:overflow-hidden md:bg-[#111]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/images/bg.mp4"
        />
        <div className="absolute inset-0 z-10 pointer-events-none" style={{background: 'linear-gradient(to right, #111 0%, rgba(17,17,17,0.7) 30%, rgba(17,17,17,0.3) 60%, transparent 100%)'}} />
      </div>
    </div>
  );
} 
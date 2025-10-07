'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/context/AuthContext';
import { useRouter } from 'next/navigation';
import { loginWithGoogle } from '@/lib/auth';
import { useOAuthRedirect } from '@/hooks/useOAuthRedirect';
import Head from 'next/head';
import { Mail, Lock, Info, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [fade, setFade] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle OAuth redirects
  useOAuthRedirect();

  // Animate card in on mount
  useEffect(() => {
    setFade(false);
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) return;
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'reset-login') {
        const { email, password } = event.data;
        if (email && password) {
          setLoading(true);
          signIn(email, password).then((result) => {
            setLoading(false);
            if (result.success) {
              router.push('/');
            } else {
              setError(result.error || 'Auto-login failed. Please sign in manually.');
            }
          });
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [signIn, router]);

  const handleModeSwitch = (newMode: 'signin' | 'signup') => {
    setFade(true);
    setTimeout(() => {
      setMode(newMode);
      setFade(false);
    }, 250); // match transition duration
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setFade(true);
    setTimeout(() => {
      router.push('/auth/forgot-password');
    }, 300); // match transition duration
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, name);
      }
      if (result.success) {
        // AuthContext will handle the redirect to last_location
        // No need to do anything here
      } else {
        setError(result.error || "An error occurred");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full max-w-2xl px-8 py-12 bg-[#111] shadow-none z-10">
      <Head>
        <title>Sign In | Trek Hub India</title>
        <meta name="description" content="Sign in to your Trek Hub India account to book treks and manage your profile." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={`w-full max-w-md flex flex-col items-center justify-center transition-opacity duration-300 ${fade ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 text-center">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          {mode === 'signup' && (
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-800 bg-[#222] text-white focus:border-[#00e676] focus:bg-[#181818] focus:outline-none transition-all"
                placeholder="Full name"
              />
            </div>
          )}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Mail size={18} /></span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-800 bg-[#222] text-white focus:border-[#00e676] focus:bg-[#181818] focus:outline-none transition-all"
              placeholder="Email"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={18} /></span>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-800 bg-[#222] text-white focus:border-[#00e676] focus:bg-[#181818] focus:outline-none transition-all"
              placeholder="Password"
            />
            {password.length > 0 && (
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00e676] focus:outline-none"
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
          {mode === 'signin' && (
            <div className="flex justify-end mt-2">
              <a
                href="/auth/forgot-password"
                onClick={handleForgotPassword}
                className="text-xs text-[#00e676] hover:text-[#00bfae] font-semibold transition-colors duration-200 cursor-pointer"
              >
                Forgot your password?
              </a>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#00e676] hover:bg-[#00bfae] text-black font-bold text-base shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00e676] focus:ring-offset-2"
          >
            {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : mode === 'signup' ? 'Create Account' : 'Login in'}
          </button>
          {/* Google Sign In Button */}
          <div className="w-full flex flex-col gap-4 mt-4">
            <button
              type="button"
              onClick={() => {
                // Store last location before Google login (handled elsewhere, no need to read here)
                // Keep the last_location for Google OAuth redirect
                loginWithGoogle();
              }}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00e676]"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g><path d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3c-7.2 0-13.4 4.1-16.7 10.1z" fill="#FFC107"/><path d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3c-7.2 0-13.4 4.1-16.7 10.1z" fill="#FF3D00"/><path d="M24 45c5.3 0 10.1-1.8 13.8-4.9l-6.4-5.2C29.5 36.1 26.9 37 24 37c-5.5 0-10.1-3.7-11.7-8.7l-7 5.4C6.6 41.1 14.7 45 24 45z" fill="#4CAF50"/><path d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.1 5.5-7.7 5.5-2.2 0-4.2-.7-5.7-2l-7 5.4C15.9 41.1 19.7 43 24 43c10.5 0 20-8.5 20-21 0-1.3-.1-2.7-.5-4z" fill="#1976D2"/></g></svg>
              Sign in with Google
            </button>
          </div>
          <div className="text-center text-gray-400 text-sm mt-2">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => handleModeSwitch('signin')} className="text-[#00e676] hover:underline font-semibold">Sign In</button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => handleModeSwitch('signup')} className="text-[#00e676] hover:underline font-semibold">Sign Up!</button>
              </>
            )}
          </div>
        </form>
        <hr className="my-8 border-gray-800" />
        <div className="flex items-start gap-3 text-gray-200 text-sm">
          <Info className="mt-1 text-[#00e676]" size={18} />
          <div>
            <span className="font-semibold">Can you change your plan?</span>
            <div className="text-gray-400">Whenever you want. Your plan will also change with you according to your needs.</div>
            <a href="/contact" className="text-[#00e676] hover:underline font-semibold">Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  );
} 
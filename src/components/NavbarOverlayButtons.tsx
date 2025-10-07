import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sun, Moon, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/context/AuthContext';
import Image from 'next/image';

export default function NavbarOverlayButtons() {
  const { user, initialized, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = window.localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', newTheme);
      setTimeout(() => {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }, 150);
    }
  };

  // Show skeleton loader for profile icon, name, and arrow if user is logged in but auth state is not initialized
  if (!initialized) {
    return (
      <div className={`hidden md:flex items-center gap-4 py-1 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl fixed top-3 right-8 z-[1200] h-14 px-6 min-w-[220px]`} style={{height: 56}}>
        <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-700 animate-pulse mr-3" />
        <div className="flex-grow h-6 rounded bg-gray-400 dark:bg-gray-700 animate-pulse" />
        <div className="w-4 h-4 rounded bg-gray-400 dark:bg-gray-700 animate-pulse ml-2" />
        <button
          onClick={toggleTheme}
          className="theme-toggle-button text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 p-2 h-10 w-10 flex items-center justify-center focus:outline-none ml-2"
          title="Toggle theme"
          type="button"
        >
          <div className={`theme-toggle-icon transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </div>
        </button>
      </div>
    );
  }

  // Only show Sign In if user is not logged in and initialized is true
  return (
    <div className={`hidden md:flex items-center gap-4 py-1 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl ${user ? 'px-6 min-w-[220px]' : 'px-3 min-w-[0]'} fixed top-3 right-8 z-[1200] h-14`} style={{height: 56}} suppressHydrationWarning={user ? undefined : true}>
      {user ? (
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            className="flex items-center font-semibold text-sm pl-0 pr-2 truncate max-w-[180px] focus:outline-none text-black dark:text-white"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            type="button"
          >
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt="avatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover mr-3 bg-gray-300 flex-shrink-0"
              />
            ) : (
              <UserIcon className="w-10 h-10 rounded-full bg-gray-300 text-black dark:text-white mr-3 flex-shrink-0 p-2" />
            )}
            <span className="flex-grow truncate text-black dark:text-white">{user.name || user.username || user.email}</span>
            <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''} text-black dark:text-white`} />
          </button>
          <button
            onClick={toggleTheme}
            className="theme-toggle-button text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 p-2 h-10 w-10 flex items-center justify-center focus:outline-none ml-2"
            title="Toggle theme"
            type="button"
          >
            <div className={`theme-toggle-icon transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg shadow-xl z-50 py-2">
              <Link
                href="/wishlist"
                className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-[#00e676]/10 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Wishlist
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-[#00e676]/10 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Dashboard
              </Link>
              {(user.role === 'admin' || user.role === 'owner') && (
                <button
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-[#00e676]/10 transition-colors"
                  onClick={async () => {
                    setCheckingAuth(true);
                    setDropdownOpen(false);
                    
                    // Show loader for at least 1 second to ensure user sees it
                    const minWait = new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Server check for activation status
                    let redirect = '/admin';
                    try {
                      const res = await fetch('/api/debug/user-details');
                      const data = await res.json();
                      
                      if (!data.user?.is_activated) {
                        redirect = '/auth/activate';
                      } else if (data.analysis?.shouldRedirect) {
                        redirect = data.analysis.shouldRedirect;
                      }
                    } catch (error) {
                      console.error('Auth check error:', error);
                      // Fallback: go to admin
                    }
                    
                    // Wait for minimum time to show loader
                    await minWait;
                    setCheckingAuth(false);
                    
                    // Redirect to appropriate page
                    window.location.href = redirect;
                  }}
                  disabled={checkingAuth}
                >
                  {checkingAuth ? (
                    <span className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#00e676] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#00e676] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[#00e676] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      Checking authentication...
                    </span>
                  ) : (
                    'Admin Panel'
                  )}
                </button>
              )}
              {/* Logout Button: Use JS-based logout instead of form */}
              <button
                type="button"
                onClick={async () => {
                  setDropdownOpen(false);
                  if (typeof signOut === 'function') {
                    await signOut();
                  } else {
                    // fallback: reload to home
                    window.location.href = '/';
                  }
                }}
                className="w-full text-left block px-4 py-2 text-sm text-black dark:text-white hover:bg-[#00e676]/10 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <Link
            href="/auth"
            className="text-black dark:text-white hover:text-[#00e676] transition-colors text-sm border border-black dark:border-white rounded-full px-5 py-2 bg-transparent backdrop-blur-md shadow-lg h-10 flex items-center font-semibold hover:bg-black/10 dark:hover:bg-white/10"
          >
            Sign In
          </Link>
          <button
            onClick={toggleTheme}
            className="theme-toggle-button text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 p-2 h-10 w-10 flex items-center justify-center focus:outline-none ml-2"
            title="Toggle theme"
            type="button"
          >
            <div className={`theme-toggle-icon transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
          </button>
        </>
      )}
      
      {/* Global Authentication Loader Overlay */}
      {checkingAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-[#00e676] rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-[#00e676] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-[#00e676] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-black dark:text-white font-medium">Checking authentication...</p>
          </div>
        </div>
      )}
    </div>
  );
} 
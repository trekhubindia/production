'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMenu } from '@/hooks/context/MenuContext';
import { useAuth } from '@/hooks/context/AuthContext';
import { usePathname } from 'next/navigation';
import { User, Settings, Sun, Moon } from 'lucide-react';
import ProgressLink from './ProgressLink';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  avatar_url?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
}

export default function Navbar({ user: userProp }: { user?: User } = {}) {
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const { user: userCtx, initialized, signOut } = useAuth();
  const pathname = usePathname() || "";

  // Hardcoded navigation links
  const mainNav = [
    { href: '/', label: 'Home' },
    { href: '/treks', label: 'Treks' },
    { href: '/blogs', label: 'Blogs' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  // Use context user when initialized, otherwise fall back to prop
  const user = initialized ? userCtx : (userProp ?? userCtx);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Skeleton loader for auth state (only after mount)
  const showAuthSkeleton = false; // Disable skeleton to prevent hydration issues

  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to light

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = window.localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Default to light
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    // Blur any focused element to prevent mobile keyboard from opening
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Focus the dummy element to prevent browser from focusing an input
    const dummy = document.getElementById('dummy-blur-target');
    if (dummy) dummy.focus();
  }, [setIsMenuOpen]);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setScrolled(window.scrollY > 2);
      } else {
        setScrolled(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
      handleScroll(); // set initial state
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isMenuOpen && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth <= 768) {
        const navbar = document.querySelector('.navbar');
        if (isMenuOpen && navbar && !navbar.contains(e.target as Node)) {
          closeMenu();
        }
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.innerWidth <= 768 && isMenuOpen) {
        closeMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mainInputs = Array.from(document.querySelectorAll('main input, main textarea'));
    if (isMenuOpen) {
      mainInputs.forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        input.setAttribute('data-old-tabindex', String(input.tabIndex));
        input.tabIndex = -1;
        input.setAttribute('readonly', 'true');
      });
    } else {
      mainInputs.forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        const oldTabIndex = input.getAttribute('data-old-tabindex');
        if (oldTabIndex !== null) input.tabIndex = Number(oldTabIndex);
        input.removeAttribute('readonly');
        input.removeAttribute('data-old-tabindex');
      });
    }
  }, [isMenuOpen]);

  return (
    <>
      {/* Blur and lock background when nav drawer is open on mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden" aria-hidden="true"></div>
      )}
      
      <nav className="navbar fixed top-0 left-0 w-full z-40 bg-transparent">
        <div className="relative w-full h-16 flex justify-center items-center">
          
          {/* Desktop glassmorphic navbar */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 hidden md:block">
            {/* Pill background */}
            <div className={`absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md shadow-xl transition-all duration-150 ease-out
              ${scrolled 
                ? 'scale-x-[8] scale-y-[1.2] translate-y-[-8px] rounded-none border-b border-l-0 border-r-0 border-t-0 border-white/20 dark:border-white/10' 
                : 'scale-x-100 scale-y-100 translate-y-0 rounded-full border border-white/20 dark:border-white/10'
              }`}></div>
            {/* Navigation content */}
            <div className="relative flex justify-center items-center py-3 px-6">
            {mainNav.map((link) => (
              <ProgressLink
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  // If clicking on the same page, scroll to top
                  if (pathname === link.href) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`nav-link no-underline relative font-semibold text-black dark:text-white py-2 px-6 rounded-lg text-base transition-colors duration-300 cursor-pointer inline-block hover:text-[#00e676] ${
                  pathname === link.href ? 'active-nav-link' : ''
                } group`}
              >
                <span className="flex flex-col items-center">
                  {link.label}
                  <span
                    className={`block h-[2.5px] bg-[#00e676] rounded-full transition-all duration-300 mt-1 mx-auto
                      ${pathname === link.href ? 'w-8' : 'w-0'}
                      group-hover:w-8`}
                  />
                </span>
              </ProgressLink>
            ))}
            </div>
          </div>
          
          {/* Mobile hamburger button */}
          <div 
              className={`hamburger block w-7 h-[22px] cursor-pointer z-[1100] md:hidden ${isMenuOpen ? 'active' : ''} absolute left-5 -top-2 flex items-center gap-2`}
              onClick={e => {
                e.preventDefault();
                toggleMenu();
                // Blur the hamburger button itself
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.blur();
                }
                // Blur any other focused element
                if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                // Focus the dummy element after a short delay
                setTimeout(() => {
                  const dummy = document.getElementById('dummy-blur-target');
                  if (dummy) dummy.focus();
                }, 50);
              }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.blur();
                }
                if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setTimeout(() => {
                  const dummy = document.getElementById('dummy-blur-target');
                  if (dummy) dummy.focus();
                }, 50);
              }}}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              role="button"
            >
              <span className="absolute h-[3px] w-full bg-black dark:bg-white rounded-[3px] opacity-100 left-0 transition-all duration-300 top-0"></span>
              <span className="absolute h-[3px] w-full bg-black dark:bg-white rounded-[3px] opacity-100 left-0 transition-all duration-300 top-[9px]"></span>
              <span className="absolute h-[3px] w-full bg-black dark:bg-white rounded-[3px] opacity-100 left-0 transition-all duration-300 top-[18px]"></span>
          </div>

          {/* Mobile menu */}
          <ul className={`nav-menu list-none flex justify-center gap-10 m-0 p-0 md:hidden ${
            isMenuOpen 
              ? 'fixed top-0 right-0 w-1/2 h-screen bg-white/20 dark:bg-black/20 backdrop-blur-xl border-l border-white/20 dark:border-white/10 flex-col justify-between pt-2 pb-5 transition-all duration-300 rounded-tl-3xl rounded-bl-3xl' 
              : 'fixed top-0 -right-1/2 w-1/2 h-screen bg-white/20 dark:bg-black/20 backdrop-blur-xl border-l border-white/20 dark:border-white/10 flex-col justify-between pt-2 pb-5 transition-all duration-300 rounded-tl-3xl rounded-bl-3xl'
          }`}>
              {/* Mobile-only sections */}
              <div className="block md:hidden flex flex-col items-center gap-5 relative h-full">
                {/* Theme toggle button at top right */}
                {mounted && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                        e.nativeEvent.stopImmediatePropagation();
                      }
                      const newTheme = theme === 'dark' ? 'light' : 'dark';
                      setTheme(newTheme);
                      if (typeof window !== 'undefined') {
                        window.localStorage.setItem('theme', newTheme);
                        document.documentElement.classList.toggle('dark', newTheme === 'dark');
                      }
                    }}
                    className="theme-toggle-button absolute top-3 right-4 text-black dark:text-white hover:text-[#00e676] p-2 rounded-full border border-white/30 dark:border-white/20 bg-white/20 dark:bg-black/20 backdrop-blur-md z-50 shadow-lg"
                    title="Toggle theme"
                  >
                    <div className={`theme-toggle-icon ${theme === 'dark' ? 'rotate-0' : 'rotate-180'} text-black dark:text-white`}>
                      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>
                  </button>
                )}
                {/* Sign In button at top if not logged in */}
                {!user && (
                  <Link
                    href="/auth"
                    onClick={closeMenu}
                    className="w-3/4 mb-4 mt-16 py-3 px-4 rounded-full bg-gradient-to-r from-[#00e676] to-[#00c95a] text-black font-bold text-base shadow-md border border-[#00e676] hover:from-[#00ffae] hover:to-[#00e676] active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00e676] flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 12h14M12 5l7 7-7 7' /></svg>
                    Sign In
                  </Link>
                )}
                {/* Content shifted down to avoid overlap with theme toggle and sign in */}
                <div className="flex flex-col items-center gap-5 w-full mt-20">
                  {/* Avatar in hamburger menu for mobile - moved to top with margin */}
                  <li className="mb-2 mt-2 flex flex-col items-center flex-shrink-0">
                    {showAuthSkeleton ? (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full border-2 border-[#00e676] shadow-lg mx-auto bg-gray-700 animate-pulse" />
                        <div className="mt-2 w-24 h-4 bg-gray-700 rounded animate-pulse mx-auto" />
                      </div>
                    ) : user ? (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full border-2 border-[#00e676] shadow-lg mx-auto bg-transparent flex items-center justify-center">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt="avatar"
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                          <User className="w-8 h-8 text-black" />
                          )}
                        </div>
                        <p className="mt-2 text-black dark:text-white text-sm">
                          {user.name || user.username || user.email}
                        </p>
                        {/* Admin/Owner Gear Icon for mobile */}
                        {(user.role === 'admin' || user.role === 'owner') && (
                          <button
                            type="button"
                            title="Admin Panel"
                            className="inline-block mt-2 text-black dark:text-white hover:text-[#00e676] transition-colors"
                            onClick={() => {
                              window.location.href = '/admin';
                            }}
                          >
                            <Settings size={26} />
                          </button>
                        )}
                      </div>
                    ) : null}
                  </li>
                  {mainNav.map((link) => (
                    <li key={link.href} className="flex-shrink-0">
                      <ProgressLink
                        href={link.href}
                        onClick={(e) => {
                          // If clicking on the same page, scroll to top
                          if (pathname === link.href) {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                          closeMenu();
                        }}
                        className={`nav-link no-underline py-4 px-6 rounded-md text-lg transition-colors duration-300 cursor-pointer inline-block flex items-center min-h-[48px] justify-center
                          ${pathname === link.href ? 'bg-[#00e676] text-black font-bold' : 'text-black dark:text-white hover:bg-[#00e676] hover:text-black'}`}
                      >
                        <span className="flex items-center">
                          {link.label}
                        </span>
                      </ProgressLink>
                    </li>
                  ))}
                  {/* Logout button at bottom if logged in */}
                  {user && (
                    <button
                      onClick={() => { closeMenu(); signOut(); }}
                      className="w-3/4 mt-10 mb-2 py-3 px-4 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-base shadow-md border border-red-500 hover:from-red-600 hover:to-red-800 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 min-h-[48px]"
                    >
                      <span className='flex items-center justify-center gap-2'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7' /></svg>
                        Logout
                      </span>
                    </button>
                  )}
                </div>
              </div>
          </ul>
          
          <style jsx>{`
            .hamburger.active span:nth-child(1) {
              transform: rotate(45deg);
              top: 9px;
            }
            .hamburger.active span:nth-child(2) {
              opacity: 0;
            }
            .hamburger.active span:nth-child(3) {
              transform: rotate(-45deg);
              top: 9px;
            }
          `}</style>
        </div>
      </nav>
    </>
  );
}
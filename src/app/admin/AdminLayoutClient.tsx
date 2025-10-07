'use client';

import React, { useState, useEffect, createContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Settings, Calendar, FileText, Users, User as UserIcon, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { CompleteUserData } from '@/lib/auth-utils';

const SIDEBAR_COLLAPSED_WIDTH = 72;
const SIDEBAR_EXPANDED_WIDTH = 224;

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: <Star className="w-5 h-5 mr-2" />, href: '/admin' },
  { key: 'treks', label: 'Treks', icon: <Settings className="w-5 h-5 mr-2" />, href: '/admin/treks' },
  { key: 'bookings', label: 'Bookings', icon: <Calendar className="w-5 h-5 mr-2" />, href: '/admin/bookings' },
  { key: 'vouchers', label: 'Vouchers', icon: <FileText className="w-5 h-5 mr-2" />, href: '/admin/vouchers' },
  { key: 'blogs', label: 'Blogs', icon: <FileText className="w-5 h-5 mr-2" />, href: '/admin/blogs' },
  { key: 'faqs', label: 'FAQs', icon: <MessageCircle className="w-5 h-5 mr-2" />, href: '/admin/faqs' },
  { key: 'qna', label: 'Q&A Messages', icon: <HelpCircle className="w-5 h-5 mr-2" />, href: '/admin/qna' },
  { key: 'subscribers', label: 'Subscribers', icon: <Mail className="w-5 h-5 mr-2" />, href: '/admin/subscribers' },
  
  { key: 'analytics', label: 'Analytics', icon: <Settings className="w-5 h-5 mr-2" />, href: '/admin/analytics' },
  { key: 'users', label: 'Users', icon: <Users className="w-5 h-5 mr-2" />, href: '/admin/users' },
  { key: 'slots', label: 'Slots', icon: <Calendar className="w-5 h-5 mr-2" />, href: '/admin/slots' },

];

// Theme context for admin panel
export const AdminThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

interface AdminLayoutClientProps {
  user: CompleteUserData;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [sidebarHover, setSidebarHover] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && window.localStorage.getItem('admin-theme') === 'dark' ? 'dark' : 'light'
  );
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = window.localStorage.getItem('admin-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  if (!mounted) return null;

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('admin-theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const sidebarWidth = sidebarHover ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <style jsx global>{`
        /* Custom scrollbar styles for admin sidebar */
        .admin-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        
        .admin-sidebar::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? '#2a2a2a' : '#f1f1f1'};
          border-radius: 2px;
        }
        
        .admin-sidebar::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#00e676' : '#00e676'};
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        
        .admin-sidebar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#00bfae' : '#00bfae'};
        }
        
        /* Firefox scrollbar styles */
        .admin-sidebar {
          scrollbar-width: thin;
          scrollbar-color: ${theme === 'dark' ? '#00e676 #2a2a2a' : '#00e676 #f1f1f1'};
        }
      `}</style>
      
      <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}>
        {/* Sidebar */}
        <aside
          className={`z-30 top-0 left-0 h-screen shadow-xl flex flex-col py-8 px-2 transition-all duration-200 overflow-y-auto overflow-x-hidden fixed admin-sidebar ${theme === 'dark' ? 'bg-[#181818]' : 'bg-white'}`}
          style={{ width: sidebarWidth }}
          onMouseEnter={() => setSidebarHover(true)}
          onMouseLeave={() => setSidebarHover(false)}
        >
          {/* User profile at top of sidebar */}
          <div className="relative mb-10 pl-2 h-12 min-h-[48px]">
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
              {user.avatar_url ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={user.avatar_url}
                    alt={user.name || user.username || user.email}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <UserIcon className="w-10 h-10 text-[#00e676]" />
              )}
            </div>
            <div className={`absolute left-15 top-1/2 transform -translate-y-1/2 transition-all duration-150 ${sidebarHover ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
              <span 
                className={`text-base font-medium max-w-[120px] truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                aria-hidden={!sidebarHover}
              >
                {user.name || user.username || user.email}
              </span>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {SECTIONS.map((s) => {
              const isActive = pathname === s.href || (s.href === '/admin' && pathname === '/admin');
              return (
                <Link
                  key={s.key}
                  href={s.href}
                  className={`flex items-center w-full px-2 py-3 rounded-lg text-base font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#00ff80] gap-2 h-12 min-h-[48px] whitespace-nowrap ${isActive ? 'bg-[#00ff80] text-black scale-105 shadow' : theme === 'dark' ? 'bg-transparent text-gray-200 hover:bg-[#00ff80]/20 hover:text-[#00ff80]' : 'bg-transparent text-gray-800 hover:bg-[#00ff80]/20 hover:text-[#00ff80]'}`}
                >
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center">{s.icon}</span>
                  <span
                    className={`ml-2 whitespace-nowrap inline-block font-mono transition-all duration-150 ${sidebarHover ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                    aria-hidden={!sidebarHover}
                  >
                    {s.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        {/* Main content with sidebar offset */}
        <div
          className={`flex-1 min-h-screen flex flex-col items-center transition-all duration-300 ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}
          style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.2s cubic-bezier(0.4,0,0.2,1)' }}
        >
          <div className="w-full flex-1">
            {children}
          </div>
        </div>
      </div>
    </AdminThemeContext.Provider>
  );
} 
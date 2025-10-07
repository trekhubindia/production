'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function StickyBackButton() {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100); // Show compact version after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to treks page if no history
      router.push('/treks');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`fixed top-6 left-6 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white shadow-lg transition-all duration-500 ease-in-out rounded-xl ${
        isScrolled 
          ? 'px-3 py-3' 
          : 'px-4 py-3'
      }`}
      aria-label="Go back"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <ArrowLeft className="w-5 h-5 flex-shrink-0" />
        <span 
          className={`font-medium whitespace-nowrap transition-all duration-500 ease-in-out ${
            isScrolled 
              ? 'opacity-0 max-w-0 ml-0' 
              : 'opacity-100 max-w-[4rem] ml-2'
          }`}
        >
          Back
        </span>
      </div>
    </button>
  );
}

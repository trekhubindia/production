'use client';

import { useState, useEffect } from 'react';
import { Facebook, Twitter, Linkedin, Copy, Heart, BookOpen } from 'lucide-react';

interface StickyShareBarProps {
  blog: {
    title: string;
    author?: string;
  };
}

export default function StickyShareBar({ blog }: StickyShareBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const shareBarHeight = 88; // Approximate height of the share bar
      
      // Calculate how much of the footer is visible
      const footerVisibleHeight = Math.max(0, windowHeight - footerRect.top);
      
      if (footerRect.top < windowHeight) {
        // Footer is entering viewport - start sliding down
        const slideProgress = Math.min(footerVisibleHeight / shareBarHeight, 1);
        const newTranslateY = slideProgress * shareBarHeight;
        setTranslateY(newTranslateY);
        setIsVisible(true);
      } else {
        // Footer is not visible - show share bar normally
        setTranslateY(0);
        setIsVisible(true);
      }
    };

    // Add scroll listener with throttling for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll);
    
    // Check initial state
    handleScroll();

    // Cleanup
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, []);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 transition-all duration-200 ease-out"
      style={{
        transform: `translateY(${translateY}px)`,
        opacity: Math.max(0, 1 - (translateY / 88))
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Share Text & Buttons */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 hidden sm:block">
              Share this article:
            </span>
            <div className="flex items-center gap-3">
              <button 
                className="w-10 h-10 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full flex items-center justify-center text-white dark:text-black transition-colors"
                title="Share on Facebook"
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                }}
              >
                <Facebook className="w-4 h-4" />
              </button>
              <button 
                className="w-10 h-10 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full flex items-center justify-center text-white dark:text-black transition-colors"
                title="Share on Twitter"
                onClick={() => {
                  const url = window.location.href;
                  const text = `Check out this article: ${blog.title}`;
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button 
                className="w-10 h-10 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full flex items-center justify-center text-white dark:text-black transition-colors"
                title="Share on LinkedIn"
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                }}
              >
                <Linkedin className="w-4 h-4" />
              </button>
              <button 
                className="w-10 h-10 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full flex items-center justify-center text-white dark:text-black transition-colors"
                title="Copy link"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  // You could add a toast notification here
                }}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-full text-sm font-semibold transition-colors">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Like</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-black dark:text-white rounded-full text-sm font-semibold transition-colors">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

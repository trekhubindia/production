import React from 'react';
import Link from 'next/link';
import { Heart, Share2 } from 'lucide-react';

interface StickyCTAProps {
  slug: string;
}

const StickyCTA: React.FC<StickyCTAProps> = ({ slug }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 border-t border-border shadow-lg flex items-center justify-between px-4 py-3 md:px-8 md:py-4 gap-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-primary/10 transition" aria-label="Add to wishlist">
          <Heart className="w-6 h-6 text-primary" />
        </button>
        <button className="p-2 rounded-full hover:bg-primary/10 transition" aria-label="Share">
          <Share2 className="w-6 h-6 text-primary" />
        </button>
      </div>
      <Link href={`/book/${slug}`} className="px-6 py-3 rounded-full bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        Book Now
      </Link>
    </div>
  );
};

export default StickyCTA; 
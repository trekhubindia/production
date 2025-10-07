'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { SmartNavigation } from '@/lib/navigation';

interface BackButtonProps {
  className?: string;
  label?: string;
  fallbackUrl?: string;
}

export default function BackButton({ className = '', label = 'Back', fallbackUrl = '/' }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    SmartNavigation.navigateBack(router, pathname, fallbackUrl);
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/50 rounded-lg ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

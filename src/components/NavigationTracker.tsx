'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { NavigationTracker } from '@/lib/navigation';

export default function NavigationTrackerComponent() {
  const pathname = usePathname();

  useEffect(() => {
    NavigationTracker.updatePath(pathname);
  }, [pathname]);

  return null; // This component doesn't render anything
}

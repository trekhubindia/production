'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RedirectManager } from '@/lib/navigation';

export default function RedirectManagerComponent() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check for simple redirects first
    const redirectTo = RedirectManager.shouldRedirect(pathname);
    if (redirectTo) {
      router.replace(redirectTo);
      return;
    }

    // Handle other redirect logic here if needed
    // This component can be extended for more complex redirect scenarios
  }, [pathname, router]);

  return null; // This component doesn't render anything
}

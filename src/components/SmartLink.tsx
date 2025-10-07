'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SmartNavigation } from '@/lib/navigation';
import { ReactNode, MouseEvent } from 'react';

interface SmartLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  target?: string;
  rel?: string;
}

export default function SmartLink({ 
  href, 
  children, 
  className, 
  onClick, 
  replace = false,
  scroll = true,
  prefetch = true,
  target,
  rel,
  ...props 
}: SmartLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Only track internal navigation
    if (href.startsWith('/') && !target) {
      // Don't prevent default - let Next.js Link handle the navigation
      // But track it for our back button functionality
      setTimeout(() => {
        SmartNavigation.navigateWithTracking(router, href);
      }, 0);
    }
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch}
      target={target}
      rel={rel}
      {...props}
    >
      {children}
    </Link>
  );
}

'use client';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoadingBar } from './LoadingBar';
import { SmartNavigation } from '@/lib/navigation';
import React, { ReactNode, startTransition } from 'react';

interface ProgressLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export default function ProgressLink({ href, children, className, onClick, ...props }: ProgressLinkProps) {
  const router = useRouter();
  const { start, done } = useLoadingBar();

  return (
    <Link
      {...props}
      href={href}
      className={className}
      onClick={e => {
        if (onClick) onClick(e);
        e.preventDefault();
        start();
        startTransition(() => {
          SmartNavigation.navigateWithTracking(router, href.toString());
          done();
        });
      }}
    >
      {children}
    </Link>
  );
} 
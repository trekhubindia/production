'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import NavbarOverlayButtons from '@/components/NavbarOverlayButtons';
import ChatLauncher from '@/components/ChatLauncher';
import NavigationTrackerComponent from '@/components/NavigationTracker';
import RedirectManagerComponent from '@/components/RedirectManager';

import { useMenu } from '@/hooks/context/MenuContext';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  // Hide navbar, overlay buttons, and chatbot on booking/payment pages
  // This includes: /book, /booking, /checkout, /payment and their sub-routes
  const isBookingOrPaymentRoute = pathname.startsWith('/book') || 
                                  pathname.startsWith('/checkout') || 
                                  pathname.startsWith('/payment') ||
                                  pathname.startsWith('/booking') ||
                                  pathname.includes('/book/') ||
                                  pathname.includes('/payment/') ||
                                  pathname.includes('/checkout/');
  
  // Hide navbar on blog detail pages (but not the main blogs listing page)
  const isBlogDetailRoute = pathname.startsWith('/blogs/') && pathname !== '/blogs';
  
  // Hide navbar on trek detail pages (but not the main treks listing page)
  const isTrekDetailRoute = pathname.startsWith('/treks/') && pathname !== '/treks';
  
  // Hide navbar on policy pages (privacy, terms, cancellation)
  const isPolicyRoute = pathname === '/privacy-policy' || 
                        pathname === '/terms-of-service' || 
                        pathname === '/cancellation-policy';
  
  const { isMenuOpen } = useMenu();

  return (
    <>
      {/* Handle global redirects */}
      <RedirectManagerComponent />
      {/* Track navigation history for proper back button functionality */}
      <NavigationTrackerComponent />
      {/* Hide navbar on admin routes, dashboard routes, booking/payment pages, blog detail pages, trek detail pages, and policy pages */}
      {!isAdminRoute && !isDashboardRoute && !isBookingOrPaymentRoute && !isBlogDetailRoute && !isTrekDetailRoute && !isPolicyRoute && <Navbar />}
      {/* Show overlay buttons on blog detail pages and trek detail pages but hide on admin/dashboard/booking/payment routes and policy pages */}
      {!isAdminRoute && !isDashboardRoute && !isBookingOrPaymentRoute && !isPolicyRoute && <NavbarOverlayButtons />}
      {children}
      {/* Hide chatbot launcher when navbar drawer is open or on admin/dashboard/booking/payment routes and policy pages (but allow on blog detail pages and trek detail pages) */}
      {!isAdminRoute && !isDashboardRoute && !isMenuOpen && !isBookingOrPaymentRoute && !isPolicyRoute && <ChatLauncher />}
    </>
  );
}
 
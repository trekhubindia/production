import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/smooth-animations.css';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import GADebugger from '@/components/GADebugger';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Trek Hub India — Himalayan Trekking Tours in India',
    template: '%s | Trek Hub India',
  },
  description: 'Explore Himalayan treks in India with certified guides. Book Kedarkantha, Valley of Flowers, Hampta Pass, Brahmatal and more. Safety-first, small-group adventures.',
  keywords: 'himalayan trekking, trekking in india, adventure tours, mountain trekking, kedarkantha trek, valley of flowers trek, hampta pass trek, brahmatal trek, auden col expedition, annapurna base camp, trekking safety, altitude sickness, trekking gear, winter trekking, summer trekking, himalayan adventure, mountain climbing, trekking company, best trekking tours, safe trekking, expert guides',
  authors: [{ name: 'Trek Hub India Team' }],
  creator: 'Trek Hub India',
  publisher: 'Trek Hub India',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nomadictravels.shop'),
  icons: {
    apple: [
      { url: '/images/logo.png', sizes: '180x180' },
    ],
  },
  openGraph: {
    title: 'Trek Hub India | Himalayan Trekking Tours in India',
    description: 'Explore Himalayan treks in India with certified guides. Book Kedarkantha, Valley of Flowers, Hampta Pass, Brahmatal and more. Safety-first, small-group adventures.',
    url: 'https://nomadictravels.shop',
    siteName: 'Trek Hub India',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Himalayan Trekking Adventures',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trek Hub India | Himalayan Trekking Tours in India',
    description: 'Explore Himalayan treks in India with certified guides. Book Kedarkantha, Valley of Flowers, Hampta Pass, Brahmatal and more. Safety-first, small-group adventures.',
    images: ['/images/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="geo.position" content="30.3752;78.0322" />
        <meta name="ICBM" content="30.3752, 78.0322" />
        
        {/* Google Analytics - Enhanced Implementation */}
        <script 
          async 
          src="https://www.googletagmanager.com/gtag/js?id=G-582SPBJ9HH"
        ></script>
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-582SPBJ9HH', {
                page_title: document.title,
                page_location: window.location.href,
                send_page_view: true,
                cookie_domain: 'nomadictravels.shop',
                cookie_flags: 'SameSite=None;Secure'
              });
              console.log('Google Analytics initialized with ID: G-582SPBJ9HH');
            `,
          }}
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TravelAgency",
              "name": "Trek Hub India",
              "description": "Himalayan trekking adventures with expert guides",
              "url": "https://nomadictravels.shop",
              "logo": "https://nomadictravels.shop/images/logo.png",
              "image": "https://nomadictravels.shop/images/logo.png",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN",
                "addressRegion": "Uttarakhand"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-98765-43210",
                "contactType": "customer service",
                "availableLanguage": "English"
              },
              "sameAs": [
                "https://facebook.com/nomadictravels",
                "https://instagram.com/nomadictravels",
                "https://twitter.com/nomadictravels"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Himalayan Trekking Tours",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "TouristTrip",
                      "name": "Kedarkantha Winter Trek",
                      "description": "Experience the magic of winter trekking in the Garhwal Himalayas"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "TouristTrip",
                      "name": "Valley of Flowers Trek",
                      "description": "Walk through a carpet of colorful alpine flowers"
                    }
                  }
                ]
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
          <GoogleAnalytics />
          <PerformanceMonitor />
          <GADebugger />
        </Providers>
      </body>
    </html>
  );
}

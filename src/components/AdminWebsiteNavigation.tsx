"use client";
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Map, 
  FileText, 
  Phone, 
  ExternalLink,
  Users,
  Calendar
} from 'lucide-react';

const WEBSITE_PAGES = [
  { 
    name: 'Home', 
    href: '/', 
    icon: <Home className="w-4 h-4" />, 
    description: 'Main landing page' 
  },
  { 
    name: 'Treks', 
    href: '/treks', 
    icon: <Map className="w-4 h-4" />, 
    description: 'Browse all treks' 
  },
  { 
    name: 'Blogs', 
    href: '/blogs', 
    icon: <FileText className="w-4 h-4" />, 
    description: 'Read trekking blogs' 
  },
  { 
    name: 'Contact', 
    href: '/contact', 
    icon: <Phone className="w-4 h-4" />, 
    description: 'Get in touch' 
  },
  { 
    name: 'About', 
    href: '/about', 
    icon: <Users className="w-4 h-4" />, 
    description: 'About our company' 
  },
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: <Calendar className="w-4 h-4" />, 
    description: 'User dashboard' 
  },
  {
    name: 'Slots',
    href: '/admin/slots',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Manage trek slots'
  }
];

export default function AdminWebsiteNavigation() {
  return (
    <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Website Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {WEBSITE_PAGES.map((page) => (
            <Link key={page.name} href={page.href} target="_blank" rel="noopener noreferrer">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-auto p-3 flex flex-col items-center gap-2 hover:bg-primary/10 transition-colors"
                title={page.description}
              >
                <span className="text-primary">{page.icon}</span>
                <span className="text-xs font-medium text-foreground">{page.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
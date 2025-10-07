import { 
  Home, 
  Mountain, 
  Briefcase, 
  Info, 
  Phone, 
  Calendar, 
  User, 
  LogOut,
  Settings,
  BookOpen,
  Heart,
  Users,
  BarChart3,
  FileText,
  Image,
  MessageSquare
} from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface NavigationIconProps {
  iconName: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Home,
  Mountain,
  Briefcase,
  Info,
  Phone,
  Calendar,
  User,
  LogOut,
  Settings,
  BookOpen,
  Heart,
  Users,
  BarChart3,
  FileText,
  Image,
  MessageSquare,
};

export default function NavigationIcon({ iconName, className = "w-5 h-5 mr-2" }: NavigationIconProps) {
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found`);
    return <User className={className} />; // Fallback icon
  }
  
  return <IconComponent className={className} />;
} 
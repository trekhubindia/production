import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Mountain, Calendar, Shield, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-black text-black dark:text-white border-t border-gray-200 dark:border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                <Mountain className="w-6 h-6 text-white dark:text-black" />
              </div>
              <h3 className="text-2xl font-bold text-black dark:text-white">
                Trek Hub India
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your trusted partner for unforgettable Himalayan adventures. We create memories that last a lifetime through expertly guided treks and personalized experiences.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Award className="w-4 h-4 text-black dark:text-white" />
              <span>Licensed & Certified Trek Operator</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-black dark:text-white">Quick Links</h4>
            <nav className="space-y-3">
              <Link href="/treks" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                All Treks
              </Link>
              <Link href="/about" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                About Us
              </Link>
              <Link href="/contact" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Contact
              </Link>
              <Link href="/booking" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Book Now
              </Link>
              <Link href="/gallery" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Gallery
              </Link>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-black dark:text-white">Our Services</h4>
            <nav className="space-y-3">
              <Link href="/treks?difficulty=easy" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Beginner Treks
              </Link>
              <Link href="/treks?difficulty=moderate" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Moderate Treks
              </Link>
              <Link href="/treks?difficulty=difficult" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Advanced Treks
              </Link>
              <Link href="/services/custom" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Custom Expeditions
              </Link>
              <Link href="/services/gear" className="block text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors duration-300 hover:translate-x-1 transform">
                Gear Rental
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-black dark:text-white">Get In Touch</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-black dark:text-white mt-1 flex-shrink-0" />
                <div className="text-gray-600 dark:text-gray-300">
                  <p className="font-medium">Headquarters</p>
                  <p className="text-sm">Dehradun, Uttarakhand, India</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
                <div className="text-gray-600 dark:text-gray-300">
                  <p className="font-medium">+91 98765 43210</p>
                  <p className="text-sm">24/7 Support Available</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
                <div className="text-gray-600 dark:text-gray-300">
                  <p className="font-medium">info@nomadictravels.shop</p>
                  <p className="text-sm">We reply within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-black dark:text-white">500+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Happy Trekkers</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-black dark:text-white">50+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Trek Routes</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-black dark:text-white">8+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Years Experience</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-black dark:text-white">4.9★</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              <p>&copy; 2025 Trek Hub India. All rights reserved.</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <Link 
                href="https://facebook.com/nomadictravels" 
                target="_blank"
                className="w-10 h-10 bg-gray-200 dark:bg-gray-800 hover:bg-black dark:hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
              >
                <Facebook className="w-5 h-5 text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />
              </Link>
              <Link 
                href="https://instagram.com/nomadictravels" 
                target="_blank"
                className="w-10 h-10 bg-gray-200 dark:bg-gray-800 hover:bg-black dark:hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
              >
                <Instagram className="w-5 h-5 text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />
              </Link>
              <Link 
                href="https://twitter.com/nomadictravels" 
                target="_blank"
                className="w-10 h-10 bg-gray-200 dark:bg-gray-800 hover:bg-black dark:hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
              >
                <Twitter className="w-5 h-5 text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />
              </Link>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors duration-300">
                Privacy Policy
              </Link>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <Link href="/terms-of-service" className="hover:text-black dark:hover:text-white transition-colors duration-300">
                Terms of Service
              </Link>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <Link href="/cancellation-policy" className="hover:text-black dark:hover:text-white transition-colors duration-300">
                Cancellation Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
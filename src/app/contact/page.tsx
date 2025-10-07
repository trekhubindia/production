import Footer from '@/components/Footer';
import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle, 
  Calendar,
  Shield,
  Award,
  Users,
  Mountain,
  CheckCircle,
  Globe,
  Headphones,
  FileText,
  Star,
  Heart
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Trek Hub India - Get Expert Trekking Advice & Support',
  description: 'Contact Trek Hub India for professional trekking guidance, booking assistance, and 24/7 support. Our expert team is ready to help plan your perfect Himalayan adventure.',
  keywords: 'contact Trek Hub India, trekking support, himalayan adventure booking, expert trekking advice, customer service, trek planning assistance',
  openGraph: {
    title: 'Contact Trek Hub India - Expert Trekking Support',
    description: 'Get professional guidance from our experienced team for your next Himalayan adventure. 24/7 support available.',
    type: 'website',
    url: 'https://nomadictravels.shop/contact',
  },
};

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Phone,
      title: 'Call Us',
      subtitle: '24/7 Support Available',
      details: ['+91 98765 43210', '+91 98765 43211'],
      description: 'Speak directly with our trekking experts for immediate assistance',
      action: 'Call Now',
      href: 'tel:+919876543210'
    },
    {
      icon: Mail,
      title: 'Email Us',
      subtitle: 'Response within 2 hours',
      details: ['info@nomadictravels.shop', 'bookings@nomadictravels.shop'],
      description: 'Send us detailed inquiries and get comprehensive responses',
      action: 'Send Email',
      href: 'mailto:info@nomadictravels.shop'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      subtitle: 'Instant responses',
      details: ['Available on', 'WhatsApp: +91 98765 43210'],
      description: 'Get quick answers to your trekking questions',
      action: 'Start Chat',
      href: 'https://wa.me/919876543210'
    }
  ];

  const officeInfo = [
    {
      icon: MapPin,
      title: 'Headquarters',
      details: [
        'Trek Hub India Pvt. Ltd.',
        'Adventure Hub, Tapovan',
        'Rishikesh, Uttarakhand 249192',
        'India'
      ]
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: [
        'Monday - Saturday: 9:00 AM - 8:00 PM',
        'Sunday: 10:00 AM - 6:00 PM',
        'Emergency Support: 24/7',
        'All times: Indian Standard Time (IST)'
      ]
    },
    {
      icon: Globe,
      title: 'Service Areas',
      details: [
        'Uttarakhand Himalayas',
        'Himachal Pradesh',
        'Nepal Trekking',
        'Ladakh & Kashmir'
      ]
    }
  ];

  const supportTypes = [
    {
      icon: Calendar,
      title: 'Booking Assistance',
      description: 'Help with trek selection, dates, and reservations'
    },
    {
      icon: Mountain,
      title: 'Trek Planning',
      description: 'Route advice, difficulty assessment, and preparation guidance'
    },
    {
      icon: Shield,
      title: 'Safety Consultation',
      description: 'Risk assessment, safety protocols, and emergency procedures'
    },
    {
      icon: FileText,
      title: 'Documentation Help',
      description: 'Permits, insurance, and required paperwork assistance'
    },
    {
      icon: Users,
      title: 'Group Bookings',
      description: 'Special arrangements for corporate and large group treks'
    },
    {
      icon: Headphones,
      title: 'Post-Trek Support',
      description: 'Feedback, reviews, and future adventure planning'
    }
  ];

  const whyContactUs = [
    'Expert guidance from certified mountain guides',
    'Personalized trek recommendations based on your experience',
    'Real-time weather and trail condition updates',
    'Flexible booking and cancellation policies',
    'Comprehensive pre-trek preparation support',
    '24/7 emergency assistance during treks'
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen bg-white dark:bg-black flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-[url('/images/mountain-pattern.svg')] bg-repeat opacity-20"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-900 px-6 py-3 rounded-full border border-gray-200 dark:border-gray-800 mb-8">
              <Headphones className="w-5 h-5 text-black dark:text-white" />
              <span className="text-sm font-medium text-black dark:text-white">Expert Support Available 24/7</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-black dark:text-white mb-8 leading-tight">
            Contact
            <br />
            <span className="text-gray-600 dark:text-gray-400">Our Experts</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            Ready to embark on your Himalayan adventure? Our experienced team is here to guide you every step of the way, 
            from planning to summit and beyond.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="tel:+919876543210"
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 inline-flex items-center gap-3"
            >
              <Phone className="w-5 h-5" />
              Call Now: +91 98765 43210
            </a>
            <a 
              href="mailto:info@nomadictravels.shop"
              className="border-2 border-black dark:border-white text-black dark:text-white px-8 py-4 rounded-2xl font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 inline-flex items-center gap-3"
            >
              <Mail className="w-5 h-5" />
              Send Email
            </a>
          </div>
        </div>
      </section>

      {/* Contact Methods Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              Multiple Ways to Reach Us
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              Choose Your Preferred
              <span className="block text-gray-600 dark:text-gray-400">Communication Method</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Whether you prefer calling, emailing, or chatting, we're available through multiple channels to provide you with the best support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <div key={index} className="bg-white dark:bg-black rounded-3xl p-8 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group hover:scale-105">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white dark:text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-2">{method.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-4">{method.subtitle}</p>
                    <div className="space-y-2 mb-6">
                      {method.details.map((detail, idx) => (
                        <p key={idx} className="text-black dark:text-white font-medium">{detail}</p>
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{method.description}</p>
                    <a 
                      href={method.href}
                      target={method.href.startsWith('http') ? '_blank' : undefined}
                      className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white px-6 py-3 rounded-2xl font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 inline-flex items-center gap-2"
                    >
                      {method.action}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Send Us a Message
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              Tell Us About Your
              <span className="block text-gray-600 dark:text-gray-400">Dream Adventure</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Share your trekking goals, experience level, and preferences. Our experts will craft a personalized adventure just for you.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Office Information Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              Visit Our Office
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              Our Headquarters
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Located in the heart of Rishikesh, our office is your gateway to Himalayan adventures. Drop by for face-to-face consultations and trek planning.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {officeInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <div key={index} className="bg-white dark:bg-black rounded-3xl p-8 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group hover:scale-105">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white dark:text-black" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-black dark:text-white mb-4">{info.title}</h3>
                      <div className="space-y-2">
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-gray-600 dark:text-gray-300 leading-relaxed">{detail}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Types Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Headphones className="w-4 h-4" />
              How We Can Help
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              Comprehensive Support
              <span className="block text-gray-600 dark:text-gray-400">For Every Need</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From initial planning to post-trek support, our team provides expert assistance at every stage of your adventure.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {supportTypes.map((support, index) => {
              const IconComponent = support.icon;
              return (
                <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform duration-300">
                      <IconComponent className="w-6 h-6 text-white dark:text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black dark:text-white mb-2">{support.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{support.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Contact Us Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Why Choose Our Support
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              Expert Guidance You Can Trust
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12">
              Our support goes beyond just answering questions. We're your partners in creating safe, memorable, and transformative mountain experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyContactUs.map((reason, index) => (
              <div key={index} className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group hover:scale-105">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black dark:bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <Heart className="w-16 h-16 text-white dark:text-black mx-auto mb-6" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-black mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-xl text-gray-300 dark:text-gray-700 mb-12 max-w-2xl mx-auto">
            Don't wait for the perfect moment – it doesn't exist. Your Himalayan adventure is just one conversation away. 
            Let's make it happen together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+919876543210"
              className="bg-white dark:bg-black text-black dark:text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-300 inline-flex items-center justify-center gap-3"
            >
              <Phone className="w-5 h-5" />
              Call Our Experts Now
            </a>
            <Link 
              href="/treks"
              className="border-2 border-white dark:border-black text-white dark:text-black px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-all duration-300 inline-flex items-center justify-center gap-3"
            >
              <Mountain className="w-5 h-5" />
              Browse Our Treks
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
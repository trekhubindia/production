import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Mountain, 
  Shield, 
  Award, 
  Users, 
  MapPin, 
  Clock, 
  Heart, 
  Star,
  CheckCircle,
  Target,
  Globe,
  Compass,
  Camera,
  Phone,
  Mail
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Trek Hub India - Professional Himalayan Trekking Company',
  description: 'Discover Trek Hub India, India\'s premier trekking company with 14+ years of experience. We\'ve safely guided 10,000+ adventurers through the Himalayas with expert guides and sustainable practices.',
  keywords: 'about Trek Hub India, himalayan trekking company, professional guides, sustainable tourism, mountain adventures, trekking experts, india trekking',
  openGraph: {
    title: 'About Trek Hub India - Professional Himalayan Trekking Company',
    description: 'Learn about our 14+ year journey in providing world-class Himalayan trekking experiences with safety, sustainability, and authenticity at our core.',
    type: 'website',
    url: 'https://nomadictravels.shop/about',
  },
};

export default function AboutPage() {
  const stats = [
    { number: '10,000+', label: 'Happy Trekkers', icon: Users },
    { number: '50+', label: 'Unique Routes', icon: Mountain },
    { number: '100+', label: 'Expert Guides', icon: Award },
    { number: '14+', label: 'Years Experience', icon: Clock },
  ];

  const values = [
    {
      title: 'Safety First',
      description: 'Every trek is meticulously planned with safety protocols, emergency procedures, and experienced guides trained in wilderness first aid.',
      icon: Shield
    },
    {
      title: 'Sustainable Tourism',
      description: 'We practice responsible tourism, supporting local communities and preserving the pristine beauty of the Himalayas for future generations.',
      icon: Globe
    },
    {
      title: 'Authentic Experiences',
      description: 'Our treks offer genuine cultural immersion, connecting you with local traditions, cuisine, and the warm hospitality of mountain communities.',
      icon: Heart
    },
    {
      title: 'Expert Guidance',
      description: 'Our certified guides possess deep knowledge of the terrain, weather patterns, flora, fauna, and cultural significance of each region.',
      icon: Compass
    }
  ];

  const achievements = [
    'ISO 9001:2015 Certified for Quality Management',
    'Ministry of Tourism, India Approved',
    'Adventure Tour Operators Association of India (ATOAI) Member',
    'Wilderness First Aid Certified Guides',
    '4.9/5 Average Customer Rating',
    'Zero Major Incidents in 14+ Years',
    'Carbon Neutral Trekking Operations',
    'Local Community Partnership Programs'
  ];

  const teamMembers = [
    { 
      name: 'Rajesh Kumar', 
      role: 'Founder & Head Guide', 
      image: '/images/team/guide1.jpg',
      experience: '14+ Years',
      specialization: 'High Altitude Treks',
      certifications: 'Wilderness First Aid, Mountain Guide Level 3'
    },
    { 
      name: 'Sarah Wilson', 
      role: 'Operations Director', 
      image: '/images/team/guide2.jpg',
      experience: '8+ Years',
      specialization: 'Logistics & Safety',
      certifications: 'Adventure Tourism Management, Risk Assessment'
    },
    { 
      name: 'Amit Sharma', 
      role: 'Safety & Training Head', 
      image: '/images/team/guide3.jpg',
      experience: '12+ Years',
      specialization: 'Emergency Response',
      certifications: 'Wilderness EMT, Rescue Operations'
    },
    { 
      name: 'Priya Negi', 
      role: 'Cultural Experience Coordinator', 
      image: '/images/team/guide4.jpg',
      experience: '6+ Years',
      specialization: 'Local Communities',
      certifications: 'Cultural Heritage Guide, Sustainable Tourism'
    }
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
              <Mountain className="w-5 h-5 text-black dark:text-white" />
              <span className="text-sm font-medium text-black dark:text-white">Professional Himalayan Trekking Company</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-black dark:text-white mb-8 leading-tight">
            About
            <br />
            <span className="text-gray-600 dark:text-gray-400">Trek Hub India</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            For over 14 years, we've been crafting extraordinary Himalayan adventures, 
            combining safety, sustainability, and authentic experiences to create memories that last a lifetime.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/treks"
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 inline-flex items-center gap-3"
            >
              <Mountain className="w-5 h-5" />
              Explore Our Treks
            </Link>
            <Link 
              href="/contact"
              className="border-2 border-black dark:border-white text-black dark:text-white px-8 py-4 rounded-2xl font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 inline-flex items-center gap-3"
            >
              <Phone className="w-5 h-5" />
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Company Story Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                Our Journey
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-8">
                From Passion to 
                <span className="block text-gray-600 dark:text-gray-400">Professional Excellence</span>
              </h2>
              <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p className="text-lg">
                  Founded in 2010 by a group of passionate mountaineers, Trek Hub India began as a dream to share the transformative power of the Himalayas with fellow adventurers. What started as weekend expeditions with friends has evolved into India's most trusted trekking company.
                </p>
                <p>
                  Our founder, Rajesh Kumar, a seasoned mountaineer with over two decades of Himalayan experience, recognized the need for professional, safety-focused trekking services that didn't compromise on authentic experiences. Today, we're proud to have guided over 10,000 trekkers safely through some of the world's most challenging and beautiful terrains.
                </p>
                <p>
                  Every trek we organize reflects our core belief: that adventure should be accessible, safe, and transformative. We've built our reputation on meticulous planning, expert guidance, and an unwavering commitment to both our clients' safety and the preservation of the pristine environments we explore.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-black dark:bg-white rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white dark:bg-black rounded-2xl p-8 space-y-6">
                  <h3 className="text-2xl font-bold text-black dark:text-white">Our Milestones</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300"><strong>2010:</strong> Founded with first trek to Kedarkantha</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300"><strong>2015:</strong> Reached 1,000 successful treks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300"><strong>2018:</strong> ISO 9001:2015 Certification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300"><strong>2020:</strong> Launched sustainable tourism initiatives</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300"><strong>2024:</strong> 10,000+ trekkers milestone achieved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              These numbers represent more than statistics – they're a testament to the trust our clients place in us and the experiences we've shared together.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group-hover:scale-105">
                    <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white dark:text-black" />
                    </div>
                    <h3 className="text-4xl font-black text-black dark:text-white mb-3">{stat.number}</h3>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              Our Core Values
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              What Drives Us Forward
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our values aren't just words on a page – they're the principles that guide every decision we make and every trek we organize.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="bg-white dark:bg-black rounded-3xl p-8 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group hover:scale-105">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white dark:text-black" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-black dark:text-white mb-4">{value.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Certifications & Achievements
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              Recognition & Trust
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our commitment to excellence has earned us recognition from industry bodies and the trust of thousands of adventurers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group hover:scale-105">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{achievement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Meet Our Team
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
              The Experts Behind Your Adventure
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our team combines decades of mountain experience with professional training to ensure your safety and create unforgettable experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white dark:bg-black rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 group hover:scale-105">
                <div className="aspect-square relative overflow-hidden">
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">{member.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium mb-3">{member.role}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-black dark:text-white" />
                      <span className="text-gray-600 dark:text-gray-300">{member.experience}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-black dark:text-white" />
                      <span className="text-gray-600 dark:text-gray-300">{member.specialization}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-black dark:text-white mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">{member.certifications}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black dark:bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-black mb-6">
            Ready to Start Your Himalayan Adventure?
          </h2>
          <p className="text-xl text-gray-300 dark:text-gray-700 mb-12 max-w-2xl mx-auto">
            Join thousands of adventurers who have trusted us with their mountain dreams. 
            Let's create your next unforgettable experience together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/treks"
              className="bg-white dark:bg-black text-black dark:text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-300 inline-flex items-center justify-center gap-3"
            >
              <Mountain className="w-5 h-5" />
              Browse Our Treks
            </Link>
            <Link 
              href="/contact"
              className="border-2 border-white dark:border-black text-white dark:text-black px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-all duration-300 inline-flex items-center justify-center gap-3"
            >
              <Mail className="w-5 h-5" />
              Contact Our Experts
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
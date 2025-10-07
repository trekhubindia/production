import { Users, ShieldCheck, Leaf, Award, Globe, HeartHandshake, Star, Compass } from 'lucide-react';

export default function WhyChooseUs() {
  const features = [
    {
      icon: <Star className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Expert Guides',
      description: 'Certified mountaineers with years of experience and deep knowledge of Himalayan terrain and culture.'
    },
    {
      icon: <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Safety First',
      description: 'Comprehensive safety protocols, modern equipment, and 24/7 emergency support for every trek.'
    },
    {
      icon: <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Small Groups',
      description: 'Maximum 12 trekkers per group for personalized attention and a better trekking experience.'
    },
    {
      icon: <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Eco-Friendly',
      description: 'Sustainable trekking practices to preserve the pristine mountain environments.'
    },
    {
      icon: <Award className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Award-Winning Service',
      description: 'Recognized for excellence in adventure tourism and customer satisfaction.'
    },
    {
      icon: <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Global Community',
      description: 'Connect with fellow adventurers from around the world and build lifelong friendships.'
    },
    {
      icon: <HeartHandshake className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Local Impact',
      description: 'Supporting local communities and promoting responsible tourism.'
    },
    {
      icon: <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />,
      title: 'Custom Itineraries',
      description: 'Flexible trek options and custom experiences for groups and individuals.'
    }
  ];

  const stats = [
    { label: 'Years Experience', value: '10+' },
    { label: 'Happy Trekkers', value: '5000+' },
    { label: 'Safety Record', value: '100%' },
    { label: 'Trek Destinations', value: '75+' }
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Why Choose Trek Hub India?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the Himalayas with India's most trusted trekking company. 
            We combine safety, expertise, and sustainable practices for unforgettable adventures.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto flex items-center justify-center">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-primary/10 rounded-xl p-8 border border-primary/20 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-primary mb-4">What Sets Us Apart</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
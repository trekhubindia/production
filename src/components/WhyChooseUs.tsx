import { Users, ShieldCheck, Leaf, Award, Globe, HeartHandshake, Star, Compass } from 'lucide-react';

export default function WhyChooseUs() {
  const features = [
    {
      icon: <Star className="w-10 h-10 text-primary mx-auto" />,
      title: 'Expert Guides',
      description: 'Certified mountaineers with years of experience and deep knowledge of Himalayan terrain and culture.'
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary mx-auto" />,
      title: 'Safety First',
      description: 'Comprehensive safety protocols, modern equipment, and 24/7 emergency support for every trek.'
    },
    {
      icon: <Users className="w-10 h-10 text-primary mx-auto" />,
      title: 'Small Groups',
      description: 'Maximum 12 trekkers per group for personalized attention and a better trekking experience.'
    },
    {
      icon: <Leaf className="w-10 h-10 text-primary mx-auto" />,
      title: 'Eco-Friendly',
      description: 'Sustainable trekking practices to preserve the pristine mountain environments.'
    },
    {
      icon: <Award className="w-10 h-10 text-primary mx-auto" />,
      title: 'Award-Winning Service',
      description: 'Recognized for excellence in adventure tourism and customer satisfaction.'
    },
    {
      icon: <Globe className="w-10 h-10 text-primary mx-auto" />,
      title: 'Global Community',
      description: 'Trekkers from 20+ countries trust us for their Himalayan adventures.'
    },
    {
      icon: <HeartHandshake className="w-10 h-10 text-primary mx-auto" />,
      title: 'Local Impact',
      description: 'Supporting local communities and promoting responsible tourism.'
    },
    {
      icon: <Compass className="w-10 h-10 text-primary mx-auto" />,
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
    <section className="why-choose-us py-20 bg-background">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-primary font-bold mb-4 text-4xl">Why Choose Us</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover what makes Trek Hub India the most trusted name in Himalayan trekking. Our commitment to safety, sustainability, and authentic experiences sets us apart from the rest.
          </p>
        </div>
        <div className="choose-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="choose-card bg-card/5 rounded-xl p-8 transition-transform duration-300 hover:-translate-y-1 border border-border/20 shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)] flex flex-col items-center text-center"
            >
              <div className="icon mb-5">{feature.icon}</div>
              <h3 className="text-primary mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-foreground leading-relaxed text-sm">{feature.description}</p>
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
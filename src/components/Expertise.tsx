import { Map, Tent, Mountain, Users, Award, Compass } from 'lucide-react';

export default function Expertise() {
  const expertiseAreas = [
    {
      icon: <Map className="w-10 h-10 text-primary mx-auto" />,
      title: 'Trek Planning',
      description: 'Meticulously planned itineraries with optimal acclimatization, scenic routes, and local insights for every trek.',
      stat: '5000+ Treks Organized',
      example: 'Custom plans for all skill levels'
    },
    {
      icon: <Tent className="w-10 h-10 text-primary mx-auto" />,
      title: 'Base Camps',
      description: 'Well-equipped base camps with essential amenities, safety equipment, and eco-friendly practices.',
      stat: '20+ Base Locations',
      example: 'Comfortable stays in remote regions'
    },
    {
      icon: <Mountain className="w-10 h-10 text-primary mx-auto" />,
      title: 'Peak Climbs',
      description: 'Technical expertise for high-altitude peak climbing expeditions, including glacier and rope work.',
      stat: '50+ Peaks Conquered',
      example: 'Guided summits for all experience levels'
    },
    {
      icon: <Users className="w-10 h-10 text-primary mx-auto" />,
      title: 'Group Leadership',
      description: 'Experienced group leaders ensure safety, motivation, and team spirit throughout the journey.',
      stat: '98% Group Satisfaction',
      example: 'Personalized attention for every trekker'
    },
    {
      icon: <Award className="w-10 h-10 text-primary mx-auto" />,
      title: 'Training & Safety',
      description: 'Certified in first aid, mountain rescue, and high-altitude safety. Regular training for all staff.',
      stat: '100% Safety Record',
      example: 'Zero major incidents in 10+ years'
    },
    {
      icon: <Compass className="w-10 h-10 text-primary mx-auto" />,
      title: 'Navigation & Logistics',
      description: 'Expertise in Himalayan navigation, permits, and logistics for seamless trekking experiences.',
      stat: 'All Permits Managed',
      example: 'Hassle-free travel and documentation'
    }
  ];

  return (
    <section className="expertise py-20 bg-background">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-primary font-bold mb-4 text-4xl">Our Expertise</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our team brings decades of combined experience in Himalayan trekking, safety, and adventure leadership. We are committed to delivering safe, memorable, and transformative journeys for every trekker.
          </p>
        </div>
        <div className="expertise-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {expertiseAreas.map((area, index) => (
            <div
              key={index}
              className="expertise-card bg-card/5 rounded-xl p-8 transition-transform duration-300 hover:-translate-y-1 border border-border/20 shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)] flex flex-col items-center text-center"
            >
              <div className="expertise-icon mb-5">{area.icon}</div>
              <h3 className="text-primary mb-3 text-xl font-semibold">{area.title}</h3>
              <p className="text-foreground leading-relaxed mb-3 text-sm">{area.description}</p>
              <div className="stat text-primary text-lg font-semibold mb-1">{area.stat}</div>
              <div className="text-xs text-muted-foreground">{area.example}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
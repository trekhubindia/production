import { Shield, Heart, Thermometer, Map, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SafetyTip {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: 'preparation' | 'safety' | 'health' | 'equipment';
}

const safetyTips: SafetyTip[] = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Physical Fitness',
    description: 'Start training 2-3 months before your trek. Focus on cardiovascular fitness, strength training, and practice carrying a backpack with weight.',
    category: 'preparation'
  },
  {
    icon: <Thermometer className="w-6 h-6" />,
    title: 'Acclimatization',
    description: 'Follow gradual altitude gain protocols. Rest days are crucial for proper acclimatization. Never rush altitude gain.',
    category: 'health'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Safety Equipment',
    description: 'Always carry essential safety gear: first aid kit, emergency communication devices, proper clothing, and navigation tools.',
    category: 'safety'
  },
  {
    icon: <Map className="w-6 h-6" />,
    title: 'Route Knowledge',
    description: 'Familiarize yourself with the trek route, weather conditions, and emergency exit points before starting.',
    category: 'preparation'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Group Safety',
    description: 'Stay with your group and guide at all times. Never venture alone in unfamiliar terrain.',
    category: 'safety'
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Weather Monitoring',
    description: 'Check weather forecasts regularly and be prepared for sudden weather changes in the mountains.',
    category: 'preparation'
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Emergency Protocols',
    description: 'Know emergency procedures and evacuation routes. Our guides are trained in mountain rescue and first aid.',
    category: 'safety'
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'Quality Equipment',
    description: 'Use certified trekking gear and equipment. We provide all technical equipment and safety gear.',
    category: 'equipment'
  }
];

const preparationChecklist = [
  'Medical fitness certificate',
  'Travel insurance with trekking coverage',
  'Proper trekking shoes and clothing',
  'Personal first aid kit',
  'Water bottles and hydration',
  'Energy snacks and nutrition',
  'Camera and power bank',
  'Personal toiletries'
];

const healthGuidelines = [
  'Consult your doctor before high-altitude treks',
  'Inform guides about any medical conditions',
  'Stay hydrated throughout the trek',
  'Recognize symptoms of altitude sickness',
  'Carry personal medications',
  'Maintain good hygiene practices'
];

export default function SafetyGuideSection() {
  return (
    <section className="safety-guide py-20 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Safety & Preparation Guide
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your safety is our top priority. Follow these comprehensive guidelines to ensure 
            a safe and enjoyable Himalayan trekking experience
          </p>
        </div>

        {/* Safety Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {safetyTips.map((tip, index) => (
            <div
              key={index}
              className="safety-tip bg-card/5 rounded-xl p-6 border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="text-primary mb-4">
                {tip.icon}
              </div>
              <h3 className="text-lg font-semibold text-primary mb-3">
                {tip.title}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed">
                {tip.description}
              </p>
            </div>
          ))}
        </div>

        {/* Preparation Checklist and Health Guidelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Preparation Checklist */}
          <div className="bg-card/5 rounded-xl p-8 border border-border/20">
            <h3 className="text-2xl font-bold text-primary mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              Preparation Checklist
            </h3>
            <div className="space-y-3">
              {preparationChecklist.map((item, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health Guidelines */}
          <div className="bg-card/5 rounded-xl p-8 border border-border/20">
            <h3 className="text-2xl font-bold text-primary mb-6 flex items-center">
              <Heart className="w-6 h-6 mr-3" />
              Health Guidelines
            </h3>
            <div className="space-y-3">
              {healthGuidelines.map((item, index) => (
                <div key={index} className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-muted-foreground">Safety Record</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Emergency Support</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">Certified</div>
            <div className="text-muted-foreground">Expert Guides</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">Insurance</div>
            <div className="text-muted-foreground">Coverage Included</div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-primary/10 rounded-xl p-8 border border-primary/20 text-center">
          <h3 className="text-2xl font-bold text-primary mb-4">
            Emergency Contact
          </h3>
          <p className="text-foreground/90 mb-4">
            Our team is available 24/7 for emergency support during treks
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="font-semibold text-primary">Emergency Hotline</div>
              <div className="text-foreground/90">+91-98765-43210</div>
            </div>
            <div>
              <div className="font-semibold text-primary">WhatsApp Support</div>
              <div className="text-foreground/90">+91-98765-43210</div>
            </div>
            <div>
              <div className="font-semibold text-primary">Email Support</div>
              <div className="text-foreground/90">emergency@trekhubindia.com</div>
            </div>
          </div>
        </div>

        {/* Additional Safety Information */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">Small Groups</div>
            <div className="text-muted-foreground">Maximum 12 trekkers per group for personalized attention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">Quality Equipment</div>
            <div className="text-muted-foreground">Certified safety gear and modern trekking equipment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">Experienced Guides</div>
            <div className="text-muted-foreground">Certified mountaineers with first aid training</div>
          </div>
        </div>
      </div>
    </section>
  );
} 
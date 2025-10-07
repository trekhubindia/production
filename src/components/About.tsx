import Link from 'next/link';
import { Mountain, Users, Award, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="about py-20 bg-white dark:bg-background">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <h1 className="text-4xl mb-5 text-black dark:text-foreground underline decoration-primary decoration-[3px] underline-offset-[5px]">
            About Trek Hub India
          </h1>
          <p className="text-lg mb-8 max-w-3xl mx-auto text-black dark:text-foreground">
            We are passionate about creating unforgettable Himalayan trekking experiences. 
            With over a decade of expertise in mountain adventures, we specialize in organizing 
            safe, sustainable, and enriching treks across the Indian Himalayas.
          </p>
        </div>

        {/* Mission and Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-card/5 rounded-xl p-8 border border-border/20">
            <h3 className="text-2xl font-bold text-primary mb-4">Our Mission</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To make Himalayan trekking accessible to everyone while maintaining the highest 
              standards of safety, sustainability, and cultural respect. We believe that 
              everyone should have the opportunity to experience the magic of the mountains.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              Our expert guides and comprehensive safety protocols ensure that every trekker 
              returns home with unforgettable memories and a deeper connection to nature.
            </p>
          </div>

          <div className="bg-card/5 rounded-xl p-8 border border-border/20">
            <h3 className="text-2xl font-bold text-primary mb-4">Our Vision</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To become the most trusted name in Himalayan trekking, known for our commitment 
              to safety, environmental conservation, and authentic mountain experiences.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              We envision a future where sustainable tourism helps preserve the pristine 
              beauty of the Himalayas while supporting local communities and cultures.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Mountain className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-primary mb-2">Expert Guides</h4>
            <p className="text-foreground/80 text-sm">
              Certified mountaineers with extensive knowledge of Himalayan terrain and local culture
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-primary mb-2">Small Groups</h4>
            <p className="text-foreground/80 text-sm">
              Maximum 12 trekkers per group for personalized attention and better experience
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-primary mb-2">Safety First</h4>
            <p className="text-foreground/80 text-sm">
              Comprehensive safety protocols, quality equipment, and emergency response systems
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-primary mb-2">Sustainable</h4>
            <p className="text-foreground/80 text-sm">
              Eco-friendly practices and support for local communities and conservation efforts
            </p>
          </div>
        </div>

        {/* Company Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">10+</div>
            <div className="text-muted-foreground">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">Happy Trekkers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">15+</div>
            <div className="text-muted-foreground">Trek Destinations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-muted-foreground">Safety Record</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/about"
            className="custom-button inline-block bg-primary text-primary-foreground border-2 border-primary py-3 px-8 text-base font-medium rounded-lg transition-all duration-300 hover:bg-primary/90"
          >
            Learn More About Us
          </Link>
        </div>
      </div>
    </div>
  );
}
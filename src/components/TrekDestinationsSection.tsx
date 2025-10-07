import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Mountain, Calendar, Users } from 'lucide-react';

interface TrekDestination {
  id: string;
  name: string;
  region: string;
  difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
  duration: string;
  maxAltitude: string;
  bestTime: string;
  image: string;
  description: string;
  highlights: string[];
  slug: string;
}

const trekDestinations: TrekDestination[] = [
  {
    id: 'kedarkantha',
    name: 'Kedarkantha Trek',
    region: 'Uttarakhand',
    difficulty: 'Moderate',
    duration: '6 Days',
    maxAltitude: '12,500 ft',
    bestTime: 'Dec-Mar',
    image: '/images/kedarkantha-winter.jpg',
    description: 'Experience the magic of winter trekking in the Garhwal Himalayas with stunning snow-covered landscapes and panoramic views of the Greater Himalayas.',
    highlights: ['Snow trekking', '360° mountain views', 'Winter camping', 'Summit climb'],
    slug: 'kedarkantha-trek'
  },
  {
    id: 'valley-of-flowers',
    name: 'Valley of Flowers Trek',
    region: 'Uttarakhand',
    difficulty: 'Easy',
    duration: '7 Days',
    maxAltitude: '14,400 ft',
    bestTime: 'Jul-Sep',
    image: '/images/valley-flowers-summer.jpg',
    description: 'Walk through a carpet of colorful alpine flowers in this UNESCO World Heritage Site, surrounded by pristine meadows and snow-capped peaks.',
    highlights: ['Alpine meadows', 'Wild flowers', 'Hemkund Sahib', 'Scenic beauty'],
    slug: 'valley-of-flowers-trek'
  },
  {
    id: 'hampta-pass',
    name: 'Hampta Pass Trek',
    region: 'Himachal Pradesh',
    difficulty: 'Moderate',
    duration: '5 Days',
    maxAltitude: '14,100 ft',
    bestTime: 'Jun-Oct',
    image: '/images/hamta.jpg',
    description: 'Cross from the lush green Kullu Valley to the barren landscape of Lahaul, experiencing dramatic changes in scenery and culture.',
    highlights: ['Pass crossing', 'Valley views', 'Cultural experience', 'River crossing'],
    slug: 'hampta-pass-trek'
  },
  {
    id: 'brahmatal',
    name: 'Brahmatal Trek',
    region: 'Uttarakhand',
    difficulty: 'Moderate',
    duration: '6 Days',
    maxAltitude: '12,250 ft',
    bestTime: 'Dec-Mar',
    image: '/images/brahmatal-spring.jpg',
    description: 'A perfect winter trek offering snow-covered trails, frozen lake, and magnificent views of Mt. Trishul and Mt. Nanda Ghunti.',
    highlights: ['Frozen lake', 'Snow trekking', 'Mountain views', 'Winter camping'],
    slug: 'brahmatal-trek'
  },
  {
    id: 'auden-col',
    name: 'Auden\'s Col Expedition',
    region: 'Uttarakhand',
    difficulty: 'Expert',
    duration: '12 Days',
    maxAltitude: '17,800 ft',
    bestTime: 'Jun-Sep',
    image: '/images/auden-col-expedition.webp',
    description: 'One of the most challenging and technical treks in the Indian Himalayas, requiring mountaineering skills and high-altitude experience.',
    highlights: ['Technical climbing', 'Glacier crossing', 'High altitude', 'Adventure'],
    slug: 'audens-col-expedition'
  },
  {
    id: 'annapurna-base-camp',
    name: 'Annapurna Base Camp',
    region: 'Nepal',
    difficulty: 'Difficult',
    duration: '14 Days',
    maxAltitude: '13,550 ft',
    bestTime: 'Mar-May, Sep-Nov',
    image: '/images/annapurna-base-camp.webp',
    description: 'Trek to the base of the majestic Annapurna massif, experiencing diverse landscapes from subtropical forests to alpine meadows.',
    highlights: ['Base camp', 'Annapurna views', 'Cultural villages', 'Alpine scenery'],
    slug: 'annapurna-base-camp-trek'
  }
];

const difficultyColors = {
  Easy: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  Moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  Difficult: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  Expert: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
};

export default function TrekDestinationsSection() {
  return (
    <section className="trek-destinations py-20 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Popular Trek Destinations
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore the most breathtaking trekking routes across the Indian Himalayas, 
            from easy valley walks to challenging high-altitude expeditions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trekDestinations.map((trek) => (
            <div
              key={trek.id}
              className="trek-card bg-card/5 rounded-xl overflow-hidden border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={trek.image}
                  alt={trek.name}
                  fill
                  className="object-cover brightness-105 contrast-110 saturate-105 hover:brightness-110 hover:contrast-115 hover:saturate-110 transition-all duration-300 hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[trek.difficulty]}`}>
                    {trek.difficulty}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center mb-2">
                  <MapPin className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">{trek.region}</span>
                </div>

                <h3 className="text-xl font-bold text-primary mb-3">
                  {trek.name}
                </h3>

                <p className="text-foreground/80 text-sm mb-4 line-clamp-3">
                  {trek.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-primary mr-2" />
                    <span className="text-muted-foreground">{trek.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <Mountain className="w-4 h-4 text-primary mr-2" />
                    <span className="text-muted-foreground">{trek.maxAltitude}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-xs text-muted-foreground">Best Time: </span>
                  <span className="text-xs font-medium text-primary">{trek.bestTime}</span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-primary mb-2">Highlights:</h4>
                  <div className="flex flex-wrap gap-1">
                    {trek.highlights.map((highlight, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/treks/${trek.slug}`}
                  className="block w-full text-center bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/treks"
            className="inline-flex items-center bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Users className="w-5 h-5 mr-2" />
            View All Treks
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">15+</div>
            <div className="text-muted-foreground">Trek Destinations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">4</div>
            <div className="text-muted-foreground">Difficulty Levels</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">Year-round</div>
            <div className="text-muted-foreground">Trekking Seasons</div>
          </div>
        </div>
      </div>
    </section>
  );
} 
 'use client';
 
 import Image from 'next/image';
 import Link from 'next/link';
 import { Award, Shield, Globe, Users } from 'lucide-react';
 import { useHomepageData } from '@/hooks/useHomepageData';

interface Partner {
  id: string;
  name: string;
  logo?: string; // from useHomepageData
  logo_url?: string; // fallback if API provides this
  website: string;
  description?: string;
  type?: 'certification' | 'partner' | 'association' | string;
}

export default function PartnersSection() {
  const { data, loading, error } = useHomepageData();

  if (loading) {
    return (
      <section className="partners py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Our Partners & Certifications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We work with leading organizations to ensure the highest standards of safety, sustainability, and quality in our trekking experiences.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded-xl mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="partners py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Our Partners & Certifications
            </h2>
            <p className="text-red-500">Failed to load partners. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const partners = data.partners as Partner[];
  const certificationPartners = partners.filter(p => p.type === 'certification');
  const businessPartners = partners.filter(p => p.type === 'partner');
  const associations = partners.filter(p => p.type === 'association');

  return (
    <section className="partners py-20 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Our Partners & Certifications
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We work with leading organizations to ensure the highest standards of safety, sustainability, and quality in our trekking experiences.
          </p>
        </div>

        {/* Certifications */}
        {certificationPartners.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <Award className="w-6 h-6 mr-2" />
              Certifications & Accreditations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificationPartners.map((partner: Partner) => (
                <div
                  key={partner.id}
                  className="partner-card bg-card/5 rounded-xl p-6 border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                      <Image
                        src={partner.logo || partner.logo_url || '/images/placeholder.png'}
                        alt={partner.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">{partner.name}</h4>
                      {partner.description && (
                        <p className="text-sm text-muted-foreground">{partner.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Visit Website →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Partners */}
        {businessPartners.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <Globe className="w-6 h-6 mr-2" />
              Business Partners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {businessPartners.map((partner: Partner) => (
                <div
                  key={partner.id}
                  className="partner-card bg-card/5 rounded-xl p-6 border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                      <Image
                        src={partner.logo || partner.logo_url || '/images/placeholder.png'}
                        alt={partner.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">{partner.name}</h4>
                      {partner.description && (
                        <p className="text-sm text-muted-foreground">{partner.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Visit Website →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associations */}
        {associations.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <Users className="w-6 h-6 mr-2" />
              Professional Associations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {associations.map((partner: Partner) => (
                <div
                  key={partner.id}
                  className="partner-card bg-card/5 rounded-xl p-6 border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                      <Image
                        src={partner.logo_url || '/images/placeholder.png'}
                        alt={partner.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">{partner.name}</h4>
                      {partner.description && (
                        <p className="text-sm text-muted-foreground">{partner.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Visit Website →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="bg-primary/10 rounded-xl p-8 border border-primary/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-6">Why Trust Us</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-lg font-semibold text-primary mb-2">Certified Guides</div>
                <div className="text-sm text-muted-foreground">All guides certified by recognized institutes</div>
              </div>
              <div className="text-center">
                <Award className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-lg font-semibold text-primary mb-2">Quality Assured</div>
                <div className="text-sm text-muted-foreground">Meeting international safety standards</div>
              </div>
              <div className="text-center">
                <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-lg font-semibold text-primary mb-2">Eco-Friendly</div>
                <div className="text-sm text-muted-foreground">Committed to sustainable practices</div>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-lg font-semibold text-primary mb-2">Community Focus</div>
                <div className="text-sm text-muted-foreground">Supporting local communities</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
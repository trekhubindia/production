import { Metadata } from 'next';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Terms of Service - Trek Hub India',
  description: 'Read our comprehensive terms of service covering booking conditions, responsibilities, and legal agreements for trekking adventures with Trek Hub India.',
  keywords: 'terms of service, booking conditions, legal agreement, Trek Hub India',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hide navbar by using a full-width container without navbar space */}
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        {/* Back button at top left */}
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <div className="bg-muted/20 border border-muted rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Last Updated:</strong> October 6, 2025
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Effective Date:</strong> October 6, 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="text-foreground/80 mb-4">
              By accessing and using the services of Trek Hub India, you agree to be bound by these Terms of Service. These Terms constitute a legally binding agreement between you and Trek Hub India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Services Provided</h2>
            <p className="text-foreground/80 mb-4">Trek Hub India provides:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Organized trekking and adventure tours in the Himalayas</li>
              <li>Accommodation, transportation, and guide services</li>
              <li>Equipment rental and permit assistance</li>
              <li>Meal services during treks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Booking and Payment</h2>
            <h3 className="text-xl font-medium text-foreground mb-3">3.1 Booking Process</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Bookings subject to availability and confirmation</li>
              <li>25% deposit required to confirm booking</li>
              <li>Balance payment due 30 days before trek</li>
              <li>All participants must provide accurate information</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">3.2 Age and Health Requirements</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Minimum age 12 years with parental consent</li>
              <li>Participants must be in good physical health</li>
              <li>Medical certificate may be required</li>
              <li>Pre-existing conditions must be disclosed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Cancellation Policy</h2>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>45+ days: 10% cancellation fee</li>
              <li>30-44 days: 25% cancellation fee</li>
              <li>15-29 days: 50% cancellation fee</li>
              <li>7-14 days: 75% cancellation fee</li>
              <li>Less than 7 days: No refund</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Participant Responsibilities</h2>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Maintain adequate fitness for chosen trek</li>
              <li>Follow all guide instructions and safety protocols</li>
              <li>Respect local customs and environment</li>
              <li>Carry required personal equipment</li>
              <li>Obtain valid travel insurance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>Important:</strong> Adventure activities involve inherent risks. Participants engage at their own risk.
              </p>
            </div>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Participants assume all risks associated with trekking</li>
              <li>Company liability limited to service cost</li>
              <li>Comprehensive insurance required for all participants</li>
              <li>Not liable for weather-related delays or cancellations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Insurance Requirements</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Mandatory:</strong> All participants must have valid travel and medical insurance.
              </p>
            </div>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Minimum ₹5,00,000 medical coverage</li>
              <li>Emergency evacuation coverage required</li>
              <li>Must cover adventure activities and high altitude</li>
              <li>Valid policy documents required before trek</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Governing Law</h2>
            <p className="text-foreground/80">
              These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of courts in Rishikesh, Uttarakhand, India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact Information</h2>
            <div className="bg-muted/20 border border-muted rounded-lg p-6">
              <p className="text-foreground mb-2"><strong>Trek Hub India</strong></p>
              <p className="text-foreground/80 mb-2">Adventure Hub, Tapovan, Rishikesh</p>
              <p className="text-foreground/80 mb-2">Uttarakhand 249192, India</p>
              <p className="text-foreground/80 mb-2">Email: legal@nomadictravels.shop</p>
              <p className="text-foreground/80">Phone: +91 98765 43210</p>
            </div>
          </section>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-8">
            <p className="text-sm text-foreground/70">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Privacy Policy - Trek Hub India',
  description: 'Learn how Trek Hub India collects, uses, and protects your personal information. Our comprehensive privacy policy ensures your data security and transparency.',
  keywords: 'privacy policy, data protection, personal information, Trek Hub India',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hide navbar by using a full-width container without navbar space */}
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        {/* Back button at top left */}
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <div className="bg-muted/20 border border-muted rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Last Updated:</strong> October 6, 2025
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Effective Date:</strong> October 6, 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-foreground/80 mb-4">
              Trek Hub India ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or book trekking adventures with us.
            </p>
            <p className="text-foreground/80">
              By accessing or using our services, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">2.1 Personal Information</h3>
            <p className="text-foreground/80 mb-4">We may collect the following personal information:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Contact Information:</strong> Name, email address, phone number, postal address</li>
              <li><strong>Identity Information:</strong> Date of birth, nationality, passport details, government-issued ID</li>
              <li><strong>Health Information:</strong> Medical conditions, fitness level, dietary requirements, emergency contacts</li>
              <li><strong>Payment Information:</strong> Credit card details, billing address, transaction history</li>
              <li><strong>Travel Preferences:</strong> Trek preferences, accommodation choices, special requirements</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Usage Data:</strong> Pages visited, time spent, click patterns, device information</li>
              <li><strong>Technical Data:</strong> IP address, browser type, operating system, referring URLs</li>
              <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground/80 mb-4">We use your personal information for the following purposes:</p>
            
            <h3 className="text-xl font-medium text-foreground mb-3">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Processing and managing your trek bookings</li>
              <li>Arranging accommodations, permits, and logistics</li>
              <li>Providing customer support and assistance</li>
              <li>Ensuring safety and emergency preparedness</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">3.2 Communication</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Sending booking confirmations and updates</li>
              <li>Providing pre-trek information and guidelines</li>
              <li>Marketing communications (with your consent)</li>
              <li>Customer surveys and feedback requests</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">3.3 Legal and Safety</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Complying with legal obligations and regulations</li>
              <li>Ensuring participant safety and emergency response</li>
              <li>Preventing fraud and protecting our business</li>
              <li>Resolving disputes and enforcing agreements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-foreground/80 mb-4">We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-medium text-foreground mb-3">4.1 Service Providers</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Local Partners:</strong> Trek guides, porters, accommodation providers</li>
              <li><strong>Transportation:</strong> Airlines, ground transport operators</li>
              <li><strong>Payment Processors:</strong> Secure payment gateway providers</li>
              <li><strong>Technology Services:</strong> Hosting, analytics, customer support platforms</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">4.2 Legal Requirements</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Government authorities for permit and visa processing</li>
              <li>Law enforcement when required by law</li>
              <li>Emergency services for safety and rescue operations</li>
              <li>Insurance companies for claims processing</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">4.3 Business Transfers</h3>
            <p className="text-foreground/80 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
            <p className="text-foreground/80 mb-4">We implement comprehensive security measures to protect your personal information:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
              <li><strong>Access Controls:</strong> Limited access on a need-to-know basis</li>
              <li><strong>Secure Storage:</strong> Encrypted databases and secure servers</li>
              <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
              <li><strong>Staff Training:</strong> Regular privacy and security training for employees</li>
            </ul>
            <p className="text-foreground/80">
              While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but will notify you of any material breaches as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights and Choices</h2>
            <p className="text-foreground/80 mb-4">You have the following rights regarding your personal information:</p>
            
            <h3 className="text-xl font-medium text-foreground mb-3">6.1 Access and Portability</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Request a copy of your personal information</li>
              <li>Receive your data in a portable format</li>
              <li>Verify the accuracy of your information</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">6.2 Correction and Deletion</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data (subject to legal requirements)</li>
              <li>Restrict processing in certain circumstances</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">6.3 Communication Preferences</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Opt-out of marketing communications</li>
              <li>Manage cookie preferences</li>
              <li>Control notification settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. International Data Transfers</h2>
            <p className="text-foreground/80 mb-4">
              As a trekking company operating internationally, we may transfer your personal information to countries outside your residence. We ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Adequacy decisions by relevant authorities</li>
              <li>Standard contractual clauses</li>
              <li>Binding corporate rules</li>
              <li>Certification schemes and codes of conduct</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Retention Period</h2>
            <p className="text-foreground/80 mb-4">We retain your personal information for different periods depending on the purpose:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Booking Data:</strong> 7 years for tax and legal compliance</li>
              <li><strong>Marketing Data:</strong> Until you opt-out or 3 years of inactivity</li>
              <li><strong>Health Information:</strong> 5 years for safety and insurance purposes</li>
              <li><strong>Website Analytics:</strong> 26 months for performance optimization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Children's Privacy</h2>
            <p className="text-foreground/80 mb-4">
              Our services are not directed to children under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete such information.
            </p>
            <p className="text-foreground/80">
              For participants under 18, we require parental or guardian consent and may collect additional information for safety and legal compliance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Updates to This Policy</h2>
            <p className="text-foreground/80 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications for significant changes</li>
              <li>Providing notice during your next interaction with our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Information</h2>
            <p className="text-foreground/80 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-muted/20 border border-muted rounded-lg p-6">
              <p className="text-foreground mb-2"><strong>Trek Hub India</strong></p>
              <p className="text-foreground/80 mb-2">Data Protection Officer</p>
              <p className="text-foreground/80 mb-2">Adventure Hub, Tapovan, Rishikesh</p>
              <p className="text-foreground/80 mb-2">Uttarakhand 249192, India</p>
              <p className="text-foreground/80 mb-2">Email: privacy@trekhubindia.com</p>
              <p className="text-foreground/80 mb-2">Phone: +91 98765 43210</p>
              <p className="text-foreground/80">Response Time: Within 30 days</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Governing Law</h2>
            <p className="text-foreground/80">
              This Privacy Policy is governed by the laws of India and the Information Technology Act, 2000, and its rules. Any disputes arising from this policy will be subject to the exclusive jurisdiction of the courts in Rishikesh, Uttarakhand, India.
            </p>
          </section>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-8">
            <p className="text-sm text-foreground/70">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. 
              Your continued use of our services after any modifications to this policy constitutes your acceptance of the updated terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

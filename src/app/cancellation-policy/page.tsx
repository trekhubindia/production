import { Metadata } from 'next';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Cancellation Policy - Trek Hub India',
  description: 'Understand our comprehensive cancellation and refund policy for trek bookings, including timelines, fees, and special circumstances.',
  keywords: 'cancellation policy, refund policy, booking cancellation, Trek Hub India',
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hide navbar by using a full-width container without navbar space */}
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        {/* Back button at top left */}
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Cancellation Policy</h1>
          
          <div className="bg-muted/20 border border-muted rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Last Updated:</strong> October 6, 2025
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Effective Date:</strong> October 6, 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Overview</h2>
            <p className="text-foreground/80 mb-4">
              This Cancellation Policy outlines the terms and conditions for cancelling trek bookings with Trek Hub India. We understand that plans can change, and we strive to be fair while also protecting our business operations and commitments to guides, porters, and local communities.
            </p>
            <p className="text-foreground/80">
              All cancellations must be made in writing via email to <strong>bookings@nomadictravels.shop</strong> and will be processed based on the date we receive your cancellation request.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Customer Cancellation Policy</h2>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Cancellation Fee Structure</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Cancellation fees are calculated based on the number of days before the trek start date:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">45+ Days Before Trek</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">10% Fee</p>
                  <p className="text-sm text-green-600 dark:text-green-400">90% Refund</p>
                </div>
                
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">30-44 Days Before Trek</h4>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">25% Fee</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">75% Refund</p>
                </div>
                
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">15-29 Days Before Trek</h4>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">50% Fee</p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">50% Refund</p>
                </div>
                
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">7-14 Days Before Trek</h4>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">75% Fee</p>
                  <p className="text-sm text-red-600 dark:text-red-400">25% Refund</p>
                </div>
              </div>
              
              <div className="mt-4 bg-red-100 dark:bg-red-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Less than 7 Days Before Trek</h4>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">No Refund</p>
                <p className="text-sm text-red-600 dark:text-red-400">100% cancellation fee applies</p>
              </div>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-3">2.1 Calculation Examples</h3>
            <div className="bg-muted/20 border border-muted rounded-lg p-6 mb-4">
              <h4 className="font-semibold mb-3">Example Scenarios:</h4>
              <ul className="space-y-2 text-foreground/80">
                <li><strong>Trek Cost: ₹25,000</strong></li>
                <li>• Cancelled 50 days before: Refund ₹22,500 (10% fee = ₹2,500)</li>
                <li>• Cancelled 35 days before: Refund ₹18,750 (25% fee = ₹6,250)</li>
                <li>• Cancelled 20 days before: Refund ₹12,500 (50% fee = ₹12,500)</li>
                <li>• Cancelled 10 days before: Refund ₹6,250 (75% fee = ₹18,750)</li>
                <li>• Cancelled 5 days before: No refund (100% fee = ₹25,000)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Company Cancellation Policy</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">3.1 Reasons for Company Cancellation</h3>
            <p className="text-foreground/80 mb-4">Trek Hub India reserves the right to cancel treks under the following circumstances:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Insufficient Bookings:</strong> Minimum group size not met (usually 4-6 participants)</li>
              <li><strong>Weather Conditions:</strong> Severe weather making the trek unsafe or impossible</li>
              <li><strong>Natural Disasters:</strong> Earthquakes, landslides, floods, or other natural calamities</li>
              <li><strong>Government Restrictions:</strong> Permit denials, area closures, or travel restrictions</li>
              <li><strong>Safety Concerns:</strong> Security threats, political unrest, or other safety issues</li>
              <li><strong>Force Majeure:</strong> Circumstances beyond our reasonable control</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">3.2 Company Cancellation Terms</h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Full Refund Guarantee</h4>
              <ul className="list-disc pl-6 text-green-700 dark:text-green-300">
                <li>100% refund of all payments made if we cancel the trek</li>
                <li>Refund processed within 7-10 business days</li>
                <li>Alternative trek dates offered when possible</li>
                <li>Credit towards future treks valid for 12 months</li>
              </ul>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-3">3.3 What We Don't Cover</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Flight cancellation or change fees</li>
              <li>Visa fees or permit costs</li>
              <li>Hotel bookings made independently</li>
              <li>Travel insurance premiums</li>
              <li>Personal expenses or equipment purchases</li>
              <li>Loss of income or consequential damages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Special Circumstances</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">4.1 Medical Emergencies</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Medical Cancellation Policy</h4>
              <ul className="list-disc pl-6 text-blue-700 dark:text-blue-300">
                <li>Medical certificate from registered doctor required</li>
                <li>Reduced cancellation fees may apply (case-by-case basis)</li>
                <li>Travel insurance claims should be pursued first</li>
                <li>Documentation must be submitted within 48 hours</li>
              </ul>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-3">4.2 Family Emergencies</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Death in immediate family: Reduced cancellation fees</li>
              <li>Serious illness of immediate family member: Case-by-case review</li>
              <li>Proper documentation required (death certificate, medical reports)</li>
              <li>Must be reported within 24 hours of the incident</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">4.3 Visa Rejection</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Valid for international treks requiring visas</li>
              <li>Official visa rejection letter required</li>
              <li>Must have applied for visa at least 45 days before trek</li>
              <li>Reduced cancellation fee of 15% applies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Refund Process</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">5.1 How to Request Cancellation</h3>
            <div className="bg-muted/20 border border-muted rounded-lg p-6 mb-4">
              <h4 className="font-semibold mb-3">Step-by-Step Process:</h4>
              <ol className="list-decimal pl-6 space-y-2 text-foreground/80">
                <li>Send cancellation request to <strong>bookings@nomadictravels.shop</strong></li>
                <li>Include booking reference number and reason for cancellation</li>
                <li>Provide supporting documents if claiming special circumstances</li>
                <li>Receive cancellation confirmation within 24 hours</li>
                <li>Refund processed within 7-10 business days</li>
              </ol>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-3">5.2 Refund Methods</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Original Payment Method:</strong> Refunds credited to original payment source</li>
              <li><strong>Bank Transfer:</strong> Direct transfer to provided bank account</li>
              <li><strong>Credit Note:</strong> Future trek credit valid for 12 months</li>
              <li><strong>Processing Time:</strong> 7-10 business days for most payment methods</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">5.3 Refund Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-muted/20 border border-muted rounded-lg p-4 text-center">
                <h4 className="font-semibold text-foreground mb-2">Credit/Debit Cards</h4>
                <p className="text-2xl font-bold text-primary">5-7 Days</p>
              </div>
              <div className="bg-muted/20 border border-muted rounded-lg p-4 text-center">
                <h4 className="font-semibold text-foreground mb-2">Bank Transfer</h4>
                <p className="text-2xl font-bold text-primary">3-5 Days</p>
              </div>
              <div className="bg-muted/20 border border-muted rounded-lg p-4 text-center">
                <h4 className="font-semibold text-foreground mb-2">UPI/Digital Wallets</h4>
                <p className="text-2xl font-bold text-primary">1-3 Days</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Group Bookings</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">6.1 Group Cancellation Rules</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Partial Cancellations:</strong> Individual members can cancel with standard fees</li>
              <li><strong>Group Size Reduction:</strong> If group falls below minimum, trek may be cancelled</li>
              <li><strong>Group Leader Responsibility:</strong> Group leader manages all cancellations</li>
              <li><strong>Bulk Discounts:</strong> May be adjusted based on final group size</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">6.2 Corporate Bookings</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Special cancellation terms may apply for corporate groups</li>
              <li>Negotiated terms documented in separate agreement</li>
              <li>Minimum 15 days notice required for any changes</li>
              <li>Replacement participants allowed up to 7 days before trek</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Travel Insurance</h2>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Strongly Recommended</h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                We strongly recommend purchasing comprehensive travel insurance that covers trip cancellation, medical emergencies, and adventure activities.
              </p>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Insurance Should Cover:</h4>
              <ul className="list-disc pl-6 text-yellow-700 dark:text-yellow-300">
                <li>Trip cancellation and interruption</li>
                <li>Medical expenses and emergency evacuation</li>
                <li>Adventure sports and high-altitude activities</li>
                <li>Personal accident and baggage loss</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Important Notes</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">No-Show Policy</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Participants who fail to show up on the trek start date without prior cancellation will not receive any refund.
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Date Changes</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Date changes are subject to availability and may incur additional charges. Must be requested at least 30 days before original trek date.
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Credit Notes</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Credit notes are valid for 12 months and can be used for any trek. They are transferable to family members.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact Information</h2>
            <div className="bg-muted/20 border border-muted rounded-lg p-6">
              <p className="text-foreground mb-4"><strong>For all cancellation requests and queries:</strong></p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-foreground/80 mb-2"><strong>Email:</strong> bookings@nomadictravels.shop</p>
                  <p className="text-foreground/80 mb-2"><strong>Phone:</strong> +91 98765 43210</p>
                  <p className="text-foreground/80"><strong>WhatsApp:</strong> +91 98765 43210</p>
                </div>
                <div>
                  <p className="text-foreground/80 mb-2"><strong>Office Hours:</strong> 9:00 AM - 6:00 PM IST</p>
                  <p className="text-foreground/80 mb-2"><strong>Response Time:</strong> Within 24 hours</p>
                  <p className="text-foreground/80"><strong>Emergency:</strong> +91 98765 43210 (24/7)</p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-8">
            <p className="text-sm text-foreground/70">
              This cancellation policy is designed to be fair to both our customers and our business operations. We appreciate your understanding and look forward to providing you with an amazing trekking experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

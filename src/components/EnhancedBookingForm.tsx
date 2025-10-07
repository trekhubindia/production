'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/context/AuthContext';
import { 
  CompleteBookingForm, 
  ParticipantForm,
  TrekPriceBreakdown,
  HealthFitnessForm,
  TravelPreferencesForm,
  LegalConsentForm,
  OptionalAddonsForm,
} from '@/lib/types/enhanced-booking-types';
import VoucherInput from '@/components/VoucherInput';

interface EnhancedBookingFormProps {
  trekSlug: string;
  trekName: string;
  trekPrice: number;
  trekMinDob?: string;
  bookingDate?: string;
  booked?: number;
}

interface Slot {
  id: string;
  date: string;
  capacity: number;
  booked: number;
  available: number;
  price: number;
}

type FormStep = 'date' | 'participants' | 'health' | 'travel' | 'review';

export default function EnhancedBookingForm({ 
  trekSlug, 
  trekName, 
  trekPrice, 
  trekMinDob = new Date(Date.now() - 12 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  bookingDate 
}: EnhancedBookingFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>('date');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(trekPrice);
  const [originalAmount, setOriginalAmount] = useState<number>(trekPrice);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [appliedVoucherId, setAppliedVoucherId] = useState<string>('');
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [priceBreakdown, setPriceBreakdown] = useState<TrekPriceBreakdown | null>(null);

  // Form data
  const [formData, setFormData] = useState<CompleteBookingForm>({
    trek_slug: trekSlug,
    booking_date: bookingDate || '',
    participants: 1,
    base_amount: trekPrice,
    
    // Customer information (primary contact)
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    customer_dob: '',
    customer_gender: undefined,
    
    // Health and fitness
    health_fitness: {
      medical_conditions: '',
      trekking_experience: undefined,
      fitness_consent: false,
      emergency_contact_name: '',
      emergency_contact_phone: '',
    },
    
    // Travel preferences
    travel_preferences: {
      accommodation_preference: '',
      dietary_requirements: '',
      special_requirements: '',
      referral_source: '',
      pickup_location: '',
      insurance_acknowledged: false,
    },
    
    // Legal consent
    legal_consent: {
      terms_accepted: false,
      liability_waiver_accepted: false,
      covid_declaration_accepted: false,
    },
    
    // Optional add-ons
    optional_addons: {
      trek_gear_rental: false,
      porter_services: false,
      addon_details: {},
    },
    
    // Participant details
    participants_details: [{
      full_name: '',
      date_of_birth: '',
      gender: undefined,
      contact_number: '',
      email_address: '',
      residential_address: '',
      country: '',
      city: '',
      state: '',
      postal_code: '',
    }],
    
    // Special requirements
    special_requirements: '',
  });

  // Fetch slots and user profile when component mounts
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/slots?trek_slug=${trekSlug}`);
        if (response.ok) {
          const data = await response.json();
          setSlots(data.allSlots || data.slots || []);
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.profile);
          
          // Update form data with profile information
          setFormData(prev => {
            // Only update if we haven't already loaded profile data
            // and only update empty fields to avoid overwriting user input
            const updatedParticipantsDetails = [...prev.participants_details];
            
            // Update primary participant (index 0) only if fields are empty
            if (updatedParticipantsDetails[0]) {
              const primaryParticipant = updatedParticipantsDetails[0];
              updatedParticipantsDetails[0] = {
                ...primaryParticipant,
                // Only update if field is empty to avoid overwriting user input
                full_name: primaryParticipant.full_name || data.profile?.full_name || data.profile?.name || user.name || '',
                date_of_birth: primaryParticipant.date_of_birth || data.profile?.date_of_birth || '',
                gender: primaryParticipant.gender || data.profile?.gender || undefined,
                contact_number: primaryParticipant.contact_number || data.profile?.phone || user.phone || '',
                email_address: primaryParticipant.email_address || data.profile?.email || user.email || '',
                residential_address: primaryParticipant.residential_address || data.profile?.location || '',
              };
            }
            
            return {
              ...prev,
              // Primary contact info (from auth_user and user_profiles)
              customer_name: prev.customer_name || data.profile?.full_name || data.profile?.name || user.name || '',
              customer_email: prev.customer_email || data.profile?.email || user.email || '',
              customer_phone: prev.customer_phone || data.profile?.phone || user.phone || '',
              customer_dob: prev.customer_dob || data.profile?.date_of_birth || '',
              customer_gender: prev.customer_gender || data.profile?.gender || undefined,
              
              // Updated participant details (preserving existing data)
              participants_details: updatedParticipantsDetails
            };
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchSlots();
    fetchUserProfile();
  }, [trekSlug, user]);

  // Update participants details when participants count changes
  useEffect(() => {
    // Ensure participants_details exists and is an array
    if (!formData.participants_details || !Array.isArray(formData.participants_details)) {
      setFormData(prev => ({
        ...prev,
        participants_details: [{
          full_name: '',
          date_of_birth: '',
          gender: undefined,
          contact_number: '',
          email_address: '',
          residential_address: '',
          country: '',
          city: '',
          state: '',
          postal_code: '',
        }]
      }));
      return;
    }

    const currentParticipants = formData.participants_details.length;
    const newParticipants = formData.participants;
    
    if (newParticipants > currentParticipants) {
      // Add new participants
      const newParticipantsArray = [...formData.participants_details];
      for (let i = currentParticipants; i < newParticipants; i++) {
        newParticipantsArray.push({
          full_name: '',
          date_of_birth: '',
          gender: undefined,
          contact_number: '',
          email_address: '',
          residential_address: '',
          country: '',
          city: '',
          state: '',
          postal_code: '',
        });
      }
      setFormData(prev => ({
        ...prev,
        participants_details: newParticipantsArray
      }));
    } else if (newParticipants < currentParticipants) {
      // Remove excess participants (but preserve existing data for remaining participants)
      setFormData(prev => ({
        ...prev,
        participants_details: prev.participants_details.slice(0, newParticipants)
      }));
    }
  }, [formData.participants]);

  const handleFormChange = (section: string, field: string, value: any) => {
    setFormData(prev => {
      const currentSection = prev[section as keyof CompleteBookingForm];
      
      // If the section is a primitive type, undefined, or an array, handle it differently
      if (typeof currentSection !== 'object' || currentSection === null || Array.isArray(currentSection)) {
        // For primitive fields or arrays, update directly
        return {
          ...prev,
          [section]: value
        };
      }
      
      // For object sections, spread the existing object and update the field
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: value
        }
      };
    });
  };

  // Helper function for updating primitive fields directly
  const handlePrimitiveFieldChange = (field: keyof CompleteBookingForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function for updating nested object fields
  const handleNestedFieldChange = <T extends keyof CompleteBookingForm>(
    section: T, 
    field: string, 
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value
      }
    }));
  };

  const handleVoucherApplied = (discount: number, finalAmount: number, voucherId: string, voucherCode?: string) => {
    setVoucherDiscount(discount);
    setTotalAmount(finalAmount);
    setAppliedVoucherId(voucherId);
    setAppliedVoucherCode(voucherCode || '');
  };

  const handleVoucherRemoved = () => {
    setVoucherDiscount(0);
    setTotalAmount(originalAmount);
    setAppliedVoucherId('');
    setAppliedVoucherCode('');
  };

  // Update original amount when participants change
  useEffect(() => {
    const newOriginalAmount = trekPrice * formData.participants;
    setOriginalAmount(newOriginalAmount);
    
    // If no voucher is applied, update total amount
    if (!appliedVoucherId) {
      setTotalAmount(newOriginalAmount);
    } else {
      // Recalculate voucher discount for new amount
      const discountPercent = (voucherDiscount / (originalAmount || 1)) * 100;
      const newDiscount = Math.round((newOriginalAmount * discountPercent) / 100);
      const newFinalAmount = Math.max(0, newOriginalAmount - newDiscount);
      setVoucherDiscount(newDiscount);
      setTotalAmount(newFinalAmount);
    }
  }, [formData.participants, trekPrice, appliedVoucherId, voucherDiscount, originalAmount]);

  const handleParticipantChange = (
    index: number,
    field: keyof ParticipantForm,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      participants_details: prev.participants_details.map((participant, i) =>
        i === index ? { ...participant, [field]: value } : participant
      ),
    }));
  };

  const steps: FormStep[] = ['date', 'participants', 'health', 'travel', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const nextStep = () => {
    // Validate current step before proceeding
    let isValid = true;
    let errorMessage = '';

    switch (currentStep) {
      case 'date':
        if (!formData.booking_date) {
          isValid = false;
          errorMessage = 'Please select a trek date';
        }
        break;
      case 'participants':
        if (!validateParticipantsStep()) {
          isValid = false;
          errorMessage = 'Please fill in all required participant details';
        }
        break;
      case 'health':
        if (!validateHealthStep()) {
          isValid = false;
          errorMessage = 'Please complete all required health and fitness information';
        }
        break;
      case 'travel':
        if (!validateTravelStep()) {
          isValid = false;
          errorMessage = 'Please complete travel preferences';
        }
        break;
    }

    if (!isValid) {
      setMessage(errorMessage);
      return;
    }

    setMessage(''); // Clear any previous error messages
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getStepTitle = (step: FormStep) => {
    const titles = {
      date: 'Select Date',
      participants: 'Participant Details',
      health: 'Health & Fitness',
      travel: 'Travel Preferences',
      review: 'Review & Confirm'
    };
    return titles[step];
  };

  const validateParticipantsStep = () => {
    console.log('🔍 Validating participants step:', {
      participantCount: formData.participants,
      participantDetailsLength: formData.participants_details?.length || 0,
      participantDetails: formData.participants_details
    });

    // Ensure participants_details exists and is an array
    if (!formData.participants_details || !Array.isArray(formData.participants_details)) {
      console.log('❌ participants_details is not a valid array:', formData.participants_details);
      return false;
    }

    // Check if participants_details array has the right length
    if (formData.participants_details.length !== formData.participants) {
      console.log(`❌ Participant array length mismatch: expected ${formData.participants}, got ${formData.participants_details.length}`);
      return false;
    }

    for (let i = 0; i < formData.participants; i++) {
      const participant = formData.participants_details[i];
      
      if (!participant) {
        console.log(`❌ Participant ${i + 1}: Participant object is undefined`);
        return false;
      }
      
      console.log(`🔍 Checking participant ${i + 1}:`, participant);
      
      // Check required fields - only name and DOB are truly required
      if (!participant.full_name?.trim()) {
        console.log(`❌ Participant ${i + 1}: Missing full name (value: "${participant.full_name}")`);
        return false;
      }
      if (!participant.date_of_birth?.trim()) {
        console.log(`❌ Participant ${i + 1}: Missing date of birth (value: "${participant.date_of_birth}")`);
        return false;
      }
      
      // For primary participant, require contact info
      if (i === 0) {
        if (!participant.contact_number?.trim()) {
          console.log(`❌ Primary participant: Missing contact number (value: "${participant.contact_number}")`);
          return false;
        }
        if (!participant.email_address?.trim()) {
          console.log(`❌ Primary participant: Missing email address (value: "${participant.email_address}")`);
          return false;
        }
      }
      
      console.log(`✅ Participant ${i + 1}: All required fields present`);
    }
    
    console.log('✅ All participants validated successfully');
    return true;
  };

  const validateHealthStep = () => {
    // Only require trekking experience and fitness consent
    // Emergency contact is recommended but not required
    if (!formData.health_fitness.trekking_experience) {
      console.log('❌ Health: Missing trekking experience');
      return false;
    }
    if (!formData.health_fitness.fitness_consent) {
      console.log('❌ Health: Fitness consent not accepted');
      return false;
    }
    return true;
  };

  const validateTravelStep = () => {
    // Travel step has no required fields, all are optional
    return true;
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);
      setMessage(''); // Clear any previous messages
      
      // Debug: Check all validation steps
      console.log('🔍 Starting booking submission validation...');
      console.log('🔍 Form data structure:', {
        participants: formData.participants,
        participants_details_length: formData.participants_details?.length,
        participants_details: formData.participants_details
      });
      
      const participantsValid = validateParticipantsStep();
      const healthValid = validateHealthStep();
      const travelValid = validateTravelStep();
      
      console.log('🔍 Validation results:', {
        participants: participantsValid,
        health: healthValid,
        travel: travelValid,
        legal_consent: {
          terms: formData.legal_consent.terms_accepted,
          liability: formData.legal_consent.liability_waiver_accepted,
          covid: formData.legal_consent.covid_declaration_accepted
        }
      });
      
      // Validate required fields before submission
      if (!formData.trek_slug || !formData.booking_date || !formData.participants || !formData.base_amount) {
        const missingFields = [];
        if (!formData.trek_slug) missingFields.push('trek_slug');
        if (!formData.booking_date) missingFields.push('booking_date');
        if (!formData.participants) missingFields.push('participants');
        if (!formData.base_amount) missingFields.push('base_amount');
        
        console.error('❌ Missing required fields:', missingFields);
        setMessage(`Please complete all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Check if all steps are valid
      if (!participantsValid) {
        console.error('❌ Participant validation failed');
        setMessage('Please complete all required participant information. Check the console for details.');
        setLoading(false);
        return;
      }
      
      if (!healthValid) {
        console.error('❌ Health validation failed');
        setMessage('Please complete health and fitness information');
        setLoading(false);
        return;
      }
      
      if (!travelValid) {
        console.error('❌ Travel validation failed');
        setMessage('Please complete travel preferences');
        setLoading(false);
        return;
      }
      
      // Check legal consent
      if (!formData.legal_consent.terms_accepted || !formData.legal_consent.liability_waiver_accepted || !formData.legal_consent.covid_declaration_accepted) {
        console.error('❌ Legal consent not complete');
        setMessage('Please accept all required terms and conditions');
        setLoading(false);
        return;
      }
      
      console.log('✅ All validations passed, preparing booking data...');
      
      // Prepare booking data with voucher information
      const bookingData = {
        ...formData,
        total_amount: totalAmount * formData.participants,
        voucher_id: appliedVoucherId || null,
        voucher_code: appliedVoucherCode || null,
        voucher_discount: voucherDiscount * formData.participants,
        original_amount: originalAmount * formData.participants
      };

      console.log('🔍 Final booking data:', bookingData);
      console.log('🚀 Sending booking request to API...');

      const response = await fetch('/api/bookings/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      console.log('🔍 API Response:', { 
        status: response.status, 
        ok: response.ok,
        result: result 
      });
      
      if (response.ok && (result.success || result.booking?.id)) {
        console.log('✅ Booking successful, redirecting...');
        router.push(`/booking-success/${result.booking.id}`);
      } else {
        console.error('❌ Booking failed:', {
          status: response.status,
          result: result
        });
        setMessage(result.error || result.details || result.message || 'Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Booking submission error:', error);
      setMessage(`An error occurred while processing your booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'date':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Select Your Trek Date</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose from available dates</p>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading dates...</div>
            ) : (
              <div className="grid gap-4">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setFormData(prev => ({ ...prev, booking_date: slot.date }))}
                    className={`p-4 border rounded-lg transition-colors ${
                      formData.booking_date === slot.date 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(slot.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{slot.available || 0} slots available</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'participants':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">How many participants?</h3>
              <p className="text-gray-600 dark:text-gray-400">Select the number of people joining this trek</p>
            </div>
            
            {/* Participant Counter */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <div className="flex items-center justify-center space-x-6">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participants: Math.max(1, prev.participants - 1) }))}
                  disabled={formData.participants <= 1}
                  className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <span className="text-xl font-bold">−</span>
                </button>
                <div className="text-center">
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{formData.participants}</span>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.participants === 1 ? 'participant' : 'participants'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participants: Math.min(10, prev.participants + 1) }))}
                  disabled={formData.participants >= 10}
                  className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Maximum 10 participants per booking
              </p>
            </div>

            {/* Participant Forms */}
            <div className="space-y-6">
              {formData.participants_details.map((participant, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{index + 1}</span>
                      </div>
                      {index === 0 ? 'Primary Participant' : `Participant ${index + 1}`}
                    </h5>
                    {index === 0 && (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {profileLoading ? 'Loading profile...' : userProfile ? 'Profile loaded' : 'Enter manually'}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label htmlFor={`participant-${index}-name`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={participant.full_name}
                        onChange={(e) => handleParticipantChange(index, 'full_name', e.target.value)}
                        required
                        disabled={index === 0 && profileLoading}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-700 transition-colors"
                        placeholder={index === 0 ? "Loading from your profile..." : "Enter full name"}
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label htmlFor={`participant-${index}-dob`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={participant.date_of_birth}
                        onChange={(e) => handleParticipantChange(index, 'date_of_birth', e.target.value)}
                        max={trekMinDob}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country
                      </label>
                      <select
                        value={participant.country || ''}
                        onChange={(e) => handleParticipantChange(index, 'country', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                        <option value="Nepal">Nepal</option>
                        <option value="Bhutan">Bhutan</option>
                        <option value="USA">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={participant.gender || ''}
                        onChange={(e) => handleParticipantChange(index, 'gender', e.target.value as any)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        value={participant.contact_number}
                        onChange={(e) => handleParticipantChange(index, 'contact_number', e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Address Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <textarea
                        value={participant.residential_address || ''}
                        onChange={(e) => handleParticipantChange(index, 'residential_address', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter street address"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={participant.city || ''}
                        onChange={(e) => handleParticipantChange(index, 'city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter city"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={participant.state || ''}
                        onChange={(e) => handleParticipantChange(index, 'state', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter state or province"
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={participant.postal_code || ''}
                        onChange={(e) => handleParticipantChange(index, 'postal_code', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter postal code"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Email Address * {index === 0 && (
                            <span className="text-xs text-gray-500 font-normal">(from your account)</span>
                          )}
                        </label>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const primaryEmail = formData.participants_details[0]?.email_address || '';
                              handleParticipantChange(index, 'email_address', primaryEmail);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
                          >
                            Same as Primary
                          </button>
                        )}
                      </div>
                      <input
                        type="email"
                        value={participant.email_address}
                        onChange={(e) => handleParticipantChange(index, 'email_address', e.target.value)}
                        disabled={index === 0}
                        required
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          index === 0 
                            ? 'bg-gray-50 cursor-not-allowed opacity-75' 
                            : ''
                        }`}
                        placeholder={index === 0 ? "Email from your account (cannot be changed)" : "Enter email address"}
                        title={index === 0 ? "This email is from your account and cannot be changed" : undefined}
                      />
                    </div>

                    {/* Residential Address */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Residential Address
                        </label>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const primaryAddress = formData.participants_details[0]?.residential_address || '';
                              handleParticipantChange(index, 'residential_address', primaryAddress);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
                          >
                            Same as Primary
                          </button>
                        )}
                      </div>
                      <textarea
                        value={participant.residential_address}
                        onChange={(e) => handleParticipantChange(index, 'residential_address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter residential address"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Health & Fitness Information</h3>
              <p className="text-gray-600 dark:text-gray-400">Help us ensure your safety during the trek</p>
            </div>

            {/* Medical Conditions */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Medical Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Do you have any medical conditions? (Optional)
                  </label>
                  <textarea
                    value={formData.health_fitness.medical_conditions || ''}
                    onChange={(e) => handleFormChange('health_fitness', 'medical_conditions', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please mention any medical conditions, allergies, or medications you're taking..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trekking Experience Level *
                  </label>
                  <select
                    value={formData.health_fitness.trekking_experience || ''}
                    onChange={(e) => handleFormChange('health_fitness', 'trekking_experience', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select your experience level</option>
                    <option value="beginner">Beginner (First time trekker)</option>
                    <option value="intermediate">Intermediate (2-5 treks completed)</option>
                    <option value="experienced">Experienced (5+ treks completed)</option>
                    <option value="expert">Expert (High altitude experience)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name (Recommended)
                  </label>
                  <input
                    type="text"
                    value={formData.health_fitness.emergency_contact_name || ''}
                    onChange={(e) => handleFormChange('health_fitness', 'emergency_contact_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Emergency contact person's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone (Recommended)
                  </label>
                  <input
                    type="tel"
                    value={formData.health_fitness.emergency_contact_phone || ''}
                    onChange={(e) => handleFormChange('health_fitness', 'emergency_contact_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Emergency contact phone number"
                  />
                </div>
              </div>
            </div>

            {/* Fitness Declaration */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-4">Fitness Declaration</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="fitness_consent"
                    checked={formData.health_fitness.fitness_consent || false}
                    onChange={(e) => handleFormChange('health_fitness', 'fitness_consent', e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="fitness_consent" className="text-sm text-blue-800 dark:text-blue-400">
                    I declare that I am physically and mentally fit to undertake this trek. I understand the risks involved and take full responsibility for my participation. *
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'travel':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Travel Preferences</h3>
              <p className="text-gray-600 dark:text-gray-400">Help us customize your trek experience</p>
            </div>

            {/* Accommodation Preferences */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Accommodation & Dietary</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accommodation Preference
                  </label>
                  <select
                    value={formData.travel_preferences.accommodation_preference || ''}
                    onChange={(e) => handleFormChange('travel_preferences', 'accommodation_preference', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No specific preference</option>
                    <option value="tent">Tent accommodation</option>
                    <option value="guesthouse">Guesthouse/Lodge</option>
                    <option value="mixed">Mixed (as per itinerary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dietary Requirements
                  </label>
                  <select
                    value={formData.travel_preferences.dietary_requirements || ''}
                    onChange={(e) => handleFormChange('travel_preferences', 'dietary_requirements', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No specific requirements</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="jain">Jain</option>
                    <option value="gluten_free">Gluten-free</option>
                    <option value="other">Other (specify in notes)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requirements or Notes (Optional)
                  </label>
                  <textarea
                    value={formData.travel_preferences.special_requirements || ''}
                    onChange={(e) => handleFormChange('travel_preferences', 'special_requirements', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requirements, celebrations, or additional information you'd like us to know..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How did you hear about us?
                  </label>
                  <select
                    value={formData.travel_preferences.referral_source || ''}
                    onChange={(e) => handleFormChange('travel_preferences', 'referral_source', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select source</option>
                    <option value="google">Google Search</option>
                    <option value="social_media">Social Media</option>
                    <option value="friend_referral">Friend/Family Referral</option>
                    <option value="travel_blog">Travel Blog/Website</option>
                    <option value="travel_agent">Travel Agent</option>
                    <option value="repeat_customer">Previous Customer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Pickup Location (if transportation needed)
                  </label>
                  <input
                    type="text"
                    value={formData.travel_preferences.pickup_location || ''}
                    onChange={(e) => handleFormChange('travel_preferences', 'pickup_location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter preferred pickup location (e.g., Delhi Airport, Haridwar Railway Station)"
                  />
                </div>
              </div>
            </div>

            {/* Travel Insurance */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-yellow-800 mb-4">Travel Insurance</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="insurance_acknowledged"
                    checked={formData.travel_preferences.insurance_acknowledged || false}
                    onChange={(e) => handleFormChange('travel_preferences', 'insurance_acknowledged', e.target.checked)}
                    className="mt-1 w-4 h-4 text-yellow-600"
                  />
                  <label htmlFor="insurance_acknowledged" className="text-sm text-yellow-800">
                    I understand that travel insurance is recommended for this trek and I am responsible for arranging my own coverage.
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Review Your Booking</h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Booking Summary</h4>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Trek:</span>
                  <span className="font-medium">{trekName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Participants:</span>
                  <span className="font-medium">{formData.participants}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span className="font-medium">₹{(originalAmount * formData.participants).toLocaleString()}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Voucher Discount:</span>
                    <span className="font-medium">-₹{(voucherDiscount * formData.participants).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Final Amount:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">₹{(totalAmount * formData.participants).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Voucher Input */}
            <div className="space-y-4">
              <VoucherInput
                amount={originalAmount * formData.participants}
                userId={user?.id}
                onVoucherApplied={handleVoucherApplied}
                onVoucherRemoved={handleVoucherRemoved}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.legal_consent.terms_accepted}
                  onChange={(e) => handleFormChange('legal_consent', 'terms_accepted', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                  I accept the terms and conditions
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="liability"
                  checked={formData.legal_consent.liability_waiver_accepted}
                  onChange={(e) => handleFormChange('legal_consent', 'liability_waiver_accepted', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="liability" className="text-sm text-gray-700 dark:text-gray-300">
                  I accept the liability waiver
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="covid"
                  checked={formData.legal_consent.covid_declaration_accepted}
                  onChange={(e) => handleFormChange('legal_consent', 'covid_declaration_accepted', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="covid" className="text-sm text-gray-700 dark:text-gray-300">
                  I accept the COVID-19 declaration
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{getStepTitle(currentStep)}</h3>
            <p className="text-gray-600 dark:text-gray-400">Step content coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Book Your Trek</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="min-h-[400px] mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors"
        >
          ← Previous
        </button>
        
        {currentStepIndex < steps.length - 1 ? (
          <div className="flex flex-col items-end gap-2">
            {currentStep === 'participants' && !validateParticipantsStep() && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔍 Manual validation check triggered');
                    validateParticipantsStep();
                  }}
                  className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Debug Validation
                </button>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please complete all required participant information
                </p>
              </div>
            )}
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 'date' && !formData.booking_date) ||
                (currentStep === 'participants' && !validateParticipantsStep())
              }
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 transition-colors"
            >
              Next →
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {(!formData.legal_consent.terms_accepted || !formData.legal_consent.liability_waiver_accepted || !formData.legal_consent.covid_declaration_accepted) && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Please accept all terms and conditions to submit your booking
              </p>
            )}
            <button
              type="button"
              disabled={!formData.legal_consent.terms_accepted || !formData.legal_consent.liability_waiver_accepted || !formData.legal_consent.covid_declaration_accepted}
              onClick={handleSubmitBooking}
              className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Submit Booking Request'}
            </button>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-red-500 dark:bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}
    </div>
  );
}

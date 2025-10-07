// Enhanced Booking Types for Comprehensive Trek Bookings
// This includes all the required fields for personal information, participants, health, etc.

export interface EnhancedBooking {
  id: string;
  user_id: string;
  trek_slug: string;
  slot_id: string;
  booking_date: string;
  participants: number;
  
  // Pricing Information
  base_amount: number;
  gst_amount: number;
  total_amount: number;
  
  // Personal Information
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_dob?: string;
  customer_age?: number;
  customer_gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Health & Fitness Information
  medical_conditions?: string;
  recent_illnesses?: string;
  current_medications?: string;
  trekking_experience?: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  fitness_consent: boolean;
  
  // Address
  residential_address?: string;
  
  // Travel & Accommodation Preferences
  needs_transportation: boolean;
  pickup_point?: string;
  accommodation_preferences?: string;
  
  // Legal & Consent
  terms_accepted: boolean;
  liability_waiver_accepted: boolean;
  covid_declaration_accepted: boolean;
  
  // Optional Add-ons
  trek_gear_rental: boolean;
  porter_services: boolean;
  addon_details?: Record<string, unknown>;
  
  // Special Requirements
  special_requirements?: string;
  
  // Status Information
  status: 'pending' | 'pending_approval' | 'approved' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'not_required' | 'paid' | 'refunded' | 'failed';
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface BookingParticipant {
  id: string;
  booking_id: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  contact_number?: string;
  email_address?: string;
  created_at: string;
}

export interface BookingDocument {
  id: string;
  booking_id: string;
  document_type: 'medical_certificate' | 'liability_waiver' | 'covid_declaration' | 'other';
  file_url: string;
  file_name: string;
  file_size?: number;
  uploaded_at: string;
}

export interface TrekPriceBreakdown {
  trek_slug: string;
  total_price_with_gst: number;
  base_price: number;
  gst_amount: number;
  gst_percentage: string;
}

// Form data interfaces for booking process

export interface HealthFitnessForm {
  medical_conditions?: string;
  recent_illnesses?: string;
  current_medications?: string;
  trekking_experience?: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  fitness_consent: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface AddressIdProofForm {
  residential_address?: string;
}

export interface TravelPreferencesForm {
  needs_transportation?: boolean;
  pickup_point?: string;
  pickup_location?: string;
  accommodation_preferences?: string;
  accommodation_preference?: string;
  dietary_requirements?: string;
  special_requirements?: string;
  referral_source?: string;
  insurance_acknowledged?: boolean;
}

export interface LegalConsentForm {
  terms_accepted: boolean;
  liability_waiver_accepted: boolean;
  covid_declaration_accepted: boolean;
}

export interface OptionalAddonsForm {
  trek_gear_rental: boolean;
  porter_services: boolean;
  addon_details?: Record<string, unknown>;
}

export interface ParticipantForm {
  full_name: string;
  date_of_birth: string; // ISO date string (YYYY-MM-DD)
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  contact_number?: string;
  email_address?: string;
  residential_address?: string;
  country?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

// Complete booking form data
export interface CompleteBookingForm {
  // Basic booking info
  trek_slug: string;
  booking_date: string;
  participants: number;
  base_amount: number;
  
  // Customer information (primary contact)
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_dob?: string;
  customer_gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Health and fitness
  health_fitness: HealthFitnessForm;
  
  // Travel preferences
  travel_preferences: TravelPreferencesForm;
  
  // Legal consent
  legal_consent: LegalConsentForm;
  
  // Optional add-ons
  optional_addons: OptionalAddonsForm;
  
  // Participant details (array for multiple participants)
  participants_details: ParticipantForm[];
  
  // Special requirements
  special_requirements?: string;
}

// Validation schemas (for form validation)

export const healthFitnessValidation = {
  medical_conditions: { required: false, maxLength: 1000 },
  recent_illnesses: { required: false, maxLength: 1000 },
  current_medications: { required: false, maxLength: 1000 },
  trekking_experience: { required: true },
  fitness_consent: { required: true, type: 'boolean' },
  emergency_contact_name: { required: true, maxLength: 255 },
  emergency_contact_phone: { required: true, maxLength: 20 }
};

export const addressIdProofValidation = {
  residential_address: { required: false, maxLength: 500 }
};

export const travelPreferencesValidation = {
  needs_transportation: { required: false, type: 'boolean' },
  pickup_point: { required: false, maxLength: 255 },
  accommodation_preferences: { required: false, maxLength: 500 },
  accommodation_preference: { required: false, maxLength: 255 },
  dietary_requirements: { required: false, maxLength: 255 },
  special_requirements: { required: false, maxLength: 1000 },
  referral_source: { required: false, maxLength: 255 },
  insurance_acknowledged: { required: false, type: 'boolean' }
};

export const legalConsentValidation = {
  terms_accepted: { required: true, type: 'boolean' },
  liability_waiver_accepted: { required: true, type: 'boolean' },
  covid_declaration_accepted: { required: true, type: 'boolean' }
};

export const participantValidation = {
  full_name: { required: true, minLength: 2, maxLength: 255 },
  date_of_birth: { required: true, type: 'date' },
  gender: { required: false },
  contact_number: { required: false, pattern: /^\+?[0-9\s\-\(\)]+$/ },
  email_address: { required: false, type: 'email' },
  residential_address: { required: false, maxLength: 500 }
};

// Utility types
export type BookingStatus = 'pending' | 'pending_approval' | 'approved' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'not_required' | 'paid' | 'refunded' | 'failed';
export type TrekkingExperience = 'beginner' | 'intermediate' | 'experienced' | 'expert';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type DocumentType = 'medical_certificate' | 'liability_waiver' | 'covid_declaration' | 'other';

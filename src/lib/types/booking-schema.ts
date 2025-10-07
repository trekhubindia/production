/**
 * Complete Bookings Table Schema Interface
 * Based on the actual database structure with all 41 columns
 */

export interface BookingRecord {
  // Core Booking Information
  id: string;
  user_id: string | null;
  trek_slug: string;
  slot_id: string | null;
  participants: number;
  booking_date: string | null; // ISO date string
  status: string;
  payment_status: string;
  confirmation_code: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp

  // Customer Information
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_dob: string | null; // ISO date string
  customer_age: number | null;
  customer_gender: string | null;

  // Emergency Contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact: string | null; // Legacy field

  // Health & Fitness Information
  medical_conditions: string | null;
  recent_illnesses: string | null;
  current_medications: string | null;
  trekking_experience: string | null;
  fitness_consent: boolean;

  // Address
  residential_address: string | null;

  // Travel & Accommodation Preferences
  needs_transportation: boolean;
  pickup_point: string | null;

  // Legal & Consent
  terms_accepted: boolean;
  liability_waiver_accepted: boolean;
  covid_declaration_accepted: boolean;

  // Optional Add-ons & Services
  trek_gear_rental: boolean;
  porter_services: boolean;

  // Special Requirements & Notes
  special_requirements: string | null;
  dietary_requirements: string | null;
  notes: string | null;

  // Pricing Information
  total_amount: number | null;
  gst_amount: string | number; // Can be string or number based on database
}

/**
 * Booking Status Enum
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REFUNDED = 'refunded'
}

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL = 'partial'
}

/**
 * ID Proof Types
 */
export enum IdProofType {
  PASSPORT = 'passport',
  AADHAR = 'aadhar',
  VOTER_ID = 'voter_id',
  DRIVING_LICENSE = 'driving_license',
  PAN_CARD = 'pan_card'
}

/**
 * Gender Options
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

/**
 * Trekking Experience Levels
 */
export enum TrekkingExperience {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  NONE = 'none'
}

/**
 * Partial booking record for creation (required fields only)
 */
export interface CreateBookingData {
  user_id?: string | null;
  trek_slug: string;
  slot_id?: string | null;
  customer_name: string;
  customer_email: string;
  participants: number;
  status?: string;
  payment_status?: string;
  
  // Optional enhanced fields
  customer_phone?: string | null;
  customer_age?: number | null;
  customer_gender?: string | null;
  medical_conditions?: string | null;
  trekking_experience?: string | null;
  fitness_consent?: boolean;
  residential_address?: string | null;
  terms_accepted?: boolean;
  liability_waiver_accepted?: boolean;
  covid_declaration_accepted?: boolean;
  total_amount?: number | null;
  gst_amount?: number;
  special_requirements?: string | null;
}

/**
 * Booking update data (all fields optional except id)
 */
export interface UpdateBookingData {
  id: string;
  status?: string;
  payment_status?: string;
  confirmation_code?: string;
  customer_phone?: string | null;
  total_amount?: number | null;
  booking_date?: string | null;
  special_requirements?: string | null;
  // Add other fields as needed for updates
}

/**
 * Enhanced booking form data structure
 */
export interface EnhancedBookingFormData {
  // Core booking info
  trek_slug: string;
  booking_date: string;
  participants: number;
  base_amount: number;
  
  // Participant details
  participants_details: Array<{
    full_name: string;
    date_of_birth: string;
    gender: string;
    contact_number: string;
    email_address: string;
    residential_address: string;
  }>;
  
  // Health & fitness
  health_fitness: {
    medical_conditions?: string;
    recent_illnesses?: string;
    current_medications?: string;
    trekking_experience: string;
    fitness_consent: boolean;
  };
  
  // Travel preferences
  travel_preferences: {
    needs_transportation: boolean;
    pickup_point?: string;
    accommodation_preferences?: string;
  };
  
  // Legal consent
  legal_consent: {
    terms_accepted: boolean;
    liability_waiver_accepted: boolean;
    covid_declaration_accepted: boolean;
  };
  
  // Optional add-ons
  optional_addons: {
    trek_gear_rental: boolean;
    porter_services: boolean;
    addon_details?: string;
  };
  
  // Special requirements
  special_requirements?: string;
}

/**
 * Database query helpers
 */
export const BookingQueries = {
  // Basic booking fields for list views
  basicFields: [
    'id',
    'customer_name',
    'customer_email',
    'trek_slug',
    'participants',
    'total_amount',
    'status',
    'payment_status',
    'created_at'
  ].join(', '),
  
  // Enhanced booking fields for detailed views
  enhancedFields: [
    'id',
    'user_id',
    'trek_slug',
    'slot_id',
    'customer_name',
    'customer_email',
    'customer_phone',
    'customer_age',
    'customer_gender',
    'participants',
    'medical_conditions',
    'trekking_experience',
    'fitness_consent',
    'residential_address',
    'terms_accepted',
    'liability_waiver_accepted',
    'covid_declaration_accepted',
    'total_amount',
    'gst_amount',
    'status',
    'payment_status',
    'special_requirements',
    'created_at',
    'updated_at'
  ].join(', '),
  
  // All fields
  allFields: '*'
};

/**
 * Type guard to check if a booking has enhanced data
 */
export function hasEnhancedData(booking: BookingRecord): boolean {
  return !!(
    booking.customer_age ||
    booking.medical_conditions ||
    booking.trekking_experience ||
    booking.fitness_consent ||
    booking.terms_accepted ||
    booking.covid_declaration_accepted
  );
}

/**
 * Helper to format booking for display
 */
export function formatBookingForDisplay(booking: BookingRecord) {
  return {
    id: booking.id,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    trekSlug: booking.trek_slug,
    participants: booking.participants,
    totalAmount: booking.total_amount,
    status: booking.status,
    paymentStatus: booking.payment_status,
    bookingDate: booking.booking_date,
    createdAt: booking.created_at,
    hasEnhancedData: hasEnhancedData(booking),
    specialRequirements: booking.special_requirements
  };
}

-- Add Enhanced Booking Columns Migration
-- This migration adds columns needed for enhanced booking functionality

-- Add enhanced booking columns to the existing bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_dob DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_age INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_gender TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_nationality TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Health & Fitness Information
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recent_illnesses TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS current_medications TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trekking_experience TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fitness_consent BOOLEAN DEFAULT false;

-- Address & ID Proof
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_proof_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_proof_number TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_proof_file_url TEXT;

-- Travel & Accommodation Preferences
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS needs_transportation BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_point TEXT;

-- Legal & Consent
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS liability_waiver_accepted BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS covid_declaration_accepted BOOLEAN DEFAULT false;

-- Optional Add-ons
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trek_gear_rental BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS porter_services BOOLEAN DEFAULT false;

-- Pricing Information
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gst_amount NUMERIC DEFAULT 0;

-- Update base_amount column type if it's text (should be numeric)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'base_amount' 
        AND data_type = 'text'
    ) THEN
        -- Convert text to numeric, handling any existing data
        ALTER TABLE bookings ALTER COLUMN base_amount TYPE NUMERIC USING 
            CASE 
                WHEN base_amount ~ '^[0-9]+\.?[0-9]*$' THEN base_amount::NUMERIC
                ELSE 0
            END;
        RAISE NOTICE '✅ Converted base_amount from text to numeric';
    END IF;
END $$;

-- Create indexes for enhanced booking columns
CREATE INDEX IF NOT EXISTS idx_bookings_customer_dob ON bookings (customer_dob) WHERE customer_dob IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_customer_gender ON bookings (customer_gender) WHERE customer_gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_id_proof_type ON bookings (id_proof_type) WHERE id_proof_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_terms_accepted ON bookings (terms_accepted) WHERE terms_accepted = true;
CREATE INDEX IF NOT EXISTS idx_bookings_fitness_consent ON bookings (fitness_consent) WHERE fitness_consent = true;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced booking columns migration completed!';
    RAISE NOTICE '📊 Added enhanced booking support to existing bookings table';
    RAISE NOTICE '🔍 Added indexes for enhanced booking queries';
    RAISE NOTICE '💰 Fixed base_amount column type to numeric';
END $$;

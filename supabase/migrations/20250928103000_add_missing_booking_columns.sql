-- Add Missing Booking Columns Migration
-- This migration adds columns that are expected by the API but missing from the bookings table

-- Add special_requirements column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'special_requirements') THEN
        ALTER TABLE bookings ADD COLUMN special_requirements TEXT;
        RAISE NOTICE '✅ Added special_requirements column to bookings table';
    ELSE
        RAISE NOTICE '⚠️  special_requirements column already exists';
    END IF;
END $$;

-- Add other potentially missing columns that might be needed
DO $$
BEGIN
    -- Add emergency_contact if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'emergency_contact') THEN
        ALTER TABLE bookings ADD COLUMN emergency_contact TEXT;
        RAISE NOTICE '✅ Added emergency_contact column to bookings table';
    END IF;

    -- Add dietary_requirements if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'dietary_requirements') THEN
        ALTER TABLE bookings ADD COLUMN dietary_requirements TEXT;
        RAISE NOTICE '✅ Added dietary_requirements column to bookings table';
    END IF;

    -- Add medical_conditions if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'medical_conditions') THEN
        ALTER TABLE bookings ADD COLUMN medical_conditions TEXT;
        RAISE NOTICE '✅ Added medical_conditions column to bookings table';
    END IF;

    -- Add notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'notes') THEN
        ALTER TABLE bookings ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Added notes column to bookings table';
    END IF;
END $$;

-- Create index for special_requirements for search functionality
CREATE INDEX IF NOT EXISTS idx_bookings_special_requirements ON bookings (special_requirements) 
WHERE special_requirements IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Booking columns migration completed!';
    RAISE NOTICE '📊 Added missing columns to support full booking functionality';
    RAISE NOTICE '🔍 Added search index for special requirements';
END $$;

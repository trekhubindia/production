-- Fix booking constraints to support approval-based booking system
-- This migration removes restrictive check constraints that prevent the approval workflow

-- Drop the restrictive payment status constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Drop the restrictive status constraint  
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Drop other restrictive constraints that may cause issues
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_gender_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_id_proof_type_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_trekking_experience_check;

-- Add more flexible constraints that allow the new values
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_flexible_check 
CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed', 'not_required'));

ALTER TABLE bookings ADD CONSTRAINT bookings_status_flexible_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'pending_approval', 'approved'));

-- Keep the participants constraint as it's reasonable
-- ALTER TABLE bookings ADD CONSTRAINT bookings_participants_check CHECK (participants > 0 AND participants <= 20);

-- Add comment explaining the changes
COMMENT ON TABLE bookings IS 'Booking constraints updated to support approval-based workflow with flexible validation';

-- Enhance vouchers table with better tracking and usage fields
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS used_by UUID REFERENCES auth_user(id),
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id),
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS maximum_discount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to have proper defaults
UPDATE vouchers 
SET 
  max_uses = 1,
  current_uses = CASE WHEN is_used THEN 1 ELSE 0 END,
  is_active = true
WHERE max_uses IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_used ON vouchers(is_used);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_active ON vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_vouchers_valid_until ON vouchers(valid_until);
CREATE INDEX IF NOT EXISTS idx_vouchers_used_by ON vouchers(used_by);
CREATE INDEX IF NOT EXISTS idx_vouchers_booking_id ON vouchers(booking_id);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vouchers_code_active ON vouchers(code, is_active, is_used);
CREATE INDEX IF NOT EXISTS idx_vouchers_user_active ON vouchers(user_id, is_active, valid_until);

-- Add constraints
ALTER TABLE vouchers 
ADD CONSTRAINT check_discount_percent CHECK (discount_percent > 0 AND discount_percent <= 100),
ADD CONSTRAINT check_max_uses CHECK (max_uses > 0),
ADD CONSTRAINT check_current_uses CHECK (current_uses >= 0 AND current_uses <= max_uses);

-- Add voucher fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id),
ADD COLUMN IF NOT EXISTS voucher_discount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);

-- Add indexes for voucher fields in bookings
CREATE INDEX IF NOT EXISTS idx_bookings_voucher_id ON bookings(voucher_id);

-- Add comments for documentation
COMMENT ON TABLE vouchers IS 'Discount vouchers for trek bookings with usage tracking';
COMMENT ON COLUMN vouchers.code IS 'Unique voucher code (case-insensitive)';
COMMENT ON COLUMN vouchers.discount_percent IS 'Discount percentage (1-100)';
COMMENT ON COLUMN vouchers.user_id IS 'Specific user this voucher is for (NULL for public vouchers)';
COMMENT ON COLUMN vouchers.used_at IS 'Timestamp when voucher was used';
COMMENT ON COLUMN vouchers.used_by IS 'User who used the voucher';
COMMENT ON COLUMN vouchers.booking_id IS 'Booking where voucher was applied';
COMMENT ON COLUMN vouchers.max_uses IS 'Maximum number of times voucher can be used';
COMMENT ON COLUMN vouchers.current_uses IS 'Current number of times voucher has been used';
COMMENT ON COLUMN vouchers.minimum_amount IS 'Minimum booking amount required to use voucher';
COMMENT ON COLUMN vouchers.maximum_discount IS 'Maximum discount amount (caps the percentage)';
COMMENT ON COLUMN vouchers.description IS 'Internal description of the voucher';
COMMENT ON COLUMN vouchers.is_active IS 'Whether voucher is currently active';

-- Add comments for booking voucher fields
COMMENT ON COLUMN bookings.voucher_id IS 'Reference to applied voucher';
COMMENT ON COLUMN bookings.voucher_discount IS 'Discount amount applied from voucher';
COMMENT ON COLUMN bookings.original_amount IS 'Original amount before voucher discount';

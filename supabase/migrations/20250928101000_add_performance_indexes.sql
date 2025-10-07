-- Performance Indexes Migration
-- Created: 2025-09-28
-- Purpose: Add comprehensive database indexes for performance optimization

-- ============================================================================
-- TREK PERFORMANCE INDEXES
-- ============================================================================

-- Composite indexes for common trek queries
CREATE INDEX IF NOT EXISTS idx_treks_status_featured 
ON treks (status, featured) 
WHERE status = true;

CREATE INDEX IF NOT EXISTS idx_treks_region_difficulty 
ON treks (region, difficulty);

CREATE INDEX IF NOT EXISTS idx_treks_status_region 
ON treks (status, region) 
WHERE status = true;

CREATE INDEX IF NOT EXISTS idx_treks_price_range 
ON treks (price) 
WHERE price IS NOT NULL AND status = true;

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_treks_name_gin 
ON treks USING gin (to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_treks_updated_at 
ON treks (updated_at);

CREATE INDEX IF NOT EXISTS idx_treks_rating 
ON treks (rating) 
WHERE rating IS NOT NULL;

-- ============================================================================
-- TREK SLOTS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_trek_slots_availability 
ON trek_slots (trek_slug, date, status) 
WHERE status IN ('open', 'full');

CREATE INDEX IF NOT EXISTS idx_trek_slots_future_dates 
ON trek_slots (date, status) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_trek_slots_capacity_check 
ON trek_slots (trek_slug, capacity, booked) 
WHERE status = 'open';

-- ============================================================================
-- BOOKING PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_status 
ON bookings (user_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_trek_date_status 
ON bookings (trek_slug, booking_date, status);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_created 
ON bookings (payment_status, created_at);

-- CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code 
-- ON bookings (confirmation_code) 
-- WHERE confirmation_code IS NOT NULL;

-- ============================================================================
-- USER PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_name_search 
ON user_profiles USING gin (to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone 
ON user_profiles (phone) 
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_session_active 
ON user_session (user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_session_cleanup 
ON user_session (expires_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_active_role 
ON user_roles (user_id, role) 
WHERE is_active = true;

-- ============================================================================
-- WISHLIST AND VOUCHER INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wishlists_user_trek 
ON wishlists (user_id, trek_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_trek_count 
ON wishlists (trek_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_created 
ON wishlists (user_id, created_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_vouchers_code_active 
-- ON vouchers (code) 
-- WHERE is_active = true;

-- CREATE INDEX IF NOT EXISTS idx_vouchers_user_active 
-- ON vouchers (user_id, is_active) 
-- WHERE is_active = true;

-- ============================================================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_treks_active_only 
ON treks (name, region, difficulty) 
WHERE status = true;

CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_only 
ON bookings (trek_slug, booking_date) 
WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_slots_available_only 
ON trek_slots (trek_slug, date) 
WHERE status = 'open';

-- ============================================================================
-- COMPOSITE INDEXES FOR DASHBOARD QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_dashboard 
ON bookings (created_at DESC, status, payment_status);

CREATE INDEX IF NOT EXISTS idx_treks_admin_dashboard 
ON treks (status, featured, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_treks_search_filter 
ON treks (region, difficulty, price, status) 
WHERE status = true;

-- ============================================================================
-- CLEANUP AND MAINTENANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_session_expired 
ON user_session (expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_cleanup 
ON password_reset_tokens (expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_active 
ON password_reset_tokens (user_id, expires_at) 
WHERE is_used = false;

CREATE INDEX IF NOT EXISTS idx_user_activation_pending 
ON user_activation (user_id, expires_at) 
WHERE is_activated = false;

-- ============================================================================
-- ANALYZE TABLES FOR BETTER QUERY PLANNING
-- ============================================================================

ANALYZE treks;
ANALYZE trek_slots;
ANALYZE bookings;
ANALYZE user_profiles;
ANALYZE user_session;
ANALYZE wishlists;
ANALYZE vouchers;

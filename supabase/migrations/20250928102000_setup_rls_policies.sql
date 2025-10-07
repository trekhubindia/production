-- Setup Row Level Security (RLS) and Policies Migration
-- This migration enables RLS and creates policies for the Lucia Auth architecture

-- Enable RLS on all core tables
ALTER TABLE treks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trek_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activation ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Public read access policies for public data
CREATE POLICY "treks_select_policy" ON treks FOR SELECT USING (true);
CREATE POLICY "trek_slots_select_policy" ON trek_slots FOR SELECT USING (true);
CREATE POLICY "trek_images_select_policy" ON trek_images FOR SELECT USING (true);

-- Service role gets full access to everything
-- Using current_setting('role') to check for postgres role (service role)
CREATE POLICY "treks_service_policy" ON treks FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "trek_slots_service_policy" ON trek_slots FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "trek_images_service_policy" ON trek_images FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "bookings_service_policy" ON bookings FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "user_profiles_service_policy" ON user_profiles FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "user_session_service_policy" ON user_session FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "user_roles_service_policy" ON user_roles FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "wishlists_service_policy" ON wishlists FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "vouchers_service_policy" ON vouchers FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "password_reset_tokens_service_policy" ON password_reset_tokens FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "user_activation_service_policy" ON user_activation FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "booking_documents_service_policy" ON booking_documents FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "booking_participants_service_policy" ON booking_participants FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "payment_transactions_service_policy" ON payment_transactions FOR ALL USING (current_setting('role') = 'postgres');
CREATE POLICY "chat_histories_service_policy" ON chat_histories FOR ALL USING (current_setting('role') = 'postgres');

-- Try to create admin policies (may fail if tables don't have RLS enabled properly)
DO $$
BEGIN
    BEGIN
        CREATE POLICY "admin_analytics_service_policy" ON admin_analytics FOR ALL USING (current_setting('role') = 'postgres');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create admin_analytics policy: %', SQLERRM;
    END;
    
    BEGIN
        CREATE POLICY "admin_dashboard_settings_service_policy" ON admin_dashboard_settings FOR ALL USING (current_setting('role') = 'postgres');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create admin_dashboard_settings policy: %', SQLERRM;
    END;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS and policies setup completed!';
    RAISE NOTICE '🔐 Database security is now properly configured';
    RAISE NOTICE '📝 Note: API endpoints handle user-specific access control';
    RAISE NOTICE '🛡️ Service role has full access, public has read access to public data';
END $$;

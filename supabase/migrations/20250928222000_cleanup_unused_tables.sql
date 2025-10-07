-- Clean up unused tables that have no code references and no data
-- This migration removes tables that are not used in the application

-- Drop unused tables (verified to have no code usage and no data)
DROP TABLE IF EXISTS admin_dashboard_settings CASCADE;
DROP TABLE IF EXISTS ai_response_cache CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS maintenance_settings CASCADE;
DROP TABLE IF EXISTS mobile_totp_accounts CASCADE;
DROP TABLE IF EXISTS mobile_totp_backup_codes CASCADE;
DROP TABLE IF EXISTS mobile_totp_verifications CASCADE;

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE '🧹 Database cleanup completed!';
    RAISE NOTICE '📊 Removed 7 unused tables:';
    RAISE NOTICE '   • admin_dashboard_settings';
    RAISE NOTICE '   • ai_response_cache';
    RAISE NOTICE '   • chat_sessions';
    RAISE NOTICE '   • maintenance_settings';
    RAISE NOTICE '   • mobile_totp_accounts';
    RAISE NOTICE '   • mobile_totp_backup_codes';
    RAISE NOTICE '   • mobile_totp_verifications';
    RAISE NOTICE '✅ Database is now cleaner and more efficient';
END $$;

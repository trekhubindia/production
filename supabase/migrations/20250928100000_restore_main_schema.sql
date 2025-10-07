

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."role" AS ENUM (
    'owner',
    'admin',
    'moderator',
    'user'
);


ALTER TYPE "public"."role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_session_activity"("session_id" character varying, "activity_type" character varying, "activity_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE user_session 
    SET 
        last_activity = NOW(),
        activity_log = activity_log || jsonb_build_object(
            'timestamp', NOW(),
            'type', activity_type,
            'data', activity_data
        )
    WHERE id = session_id;
END;
$$;


ALTER FUNCTION "public"."add_session_activity"("session_id" character varying, "activity_type" character varying, "activity_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."append_activity_log"("session_id" "uuid", "new_activity" "jsonb", "expires_at" timestamp with time zone, "last_activity" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE user_session
  SET
    last_activity = append_activity_log.last_activity,
    expires_at = append_activity_log.expires_at,
    activity_log = activity_log || append_activity_log.new_activity
  WHERE id = append_activity_log.session_id;
END;
$$;


ALTER FUNCTION "public"."append_activity_log"("session_id" "uuid", "new_activity" "jsonb", "expires_at" timestamp with time zone, "last_activity" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_confirm_booking_after_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If payment is successful and booking is not already confirmed
    IF NEW.status = 'succeeded' AND OLD.status != 'succeeded' THEN
        -- Update booking status to confirmed
        UPDATE bookings 
        SET 
            status = 'confirmed',
            payment_status = CASE 
                WHEN NEW.payment_type = 'full' THEN 'paid'
                WHEN NEW.payment_type = 'advance' THEN 'partially_paid'
                ELSE payment_status
            END,
            auto_confirmed = TRUE,
            updated_at = NOW()
        WHERE id = NEW.booking_id;
        
        -- Log the auto-confirmation
        RAISE NOTICE 'Booking % auto-confirmed after % payment of %', 
            NEW.booking_id, NEW.payment_type, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_confirm_booking_after_payment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_gst_amount"("base_amount" numeric) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN ROUND(base_amount * 0.05, 2);
END;
$$;


ALTER FUNCTION "public"."calculate_gst_amount"("base_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_payment_amounts"("total_amount" numeric, "payment_type" character varying) RETURNS TABLE("advance_amount" numeric, "remaining_amount" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF payment_type = 'advance' THEN
        RETURN QUERY SELECT 
            total_amount * 0.1,  -- 10% advance
            total_amount * 0.9;  -- 90% remaining
    ELSE
        RETURN QUERY SELECT 
            total_amount,        -- Full amount
            0;                   -- No remaining amount
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_payment_amounts"("total_amount" numeric, "payment_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_total_amount_with_gst"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.gst_amount = calculate_gst_amount(NEW.base_amount);
    NEW.total_amount = NEW.base_amount + NEW.gst_amount;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_total_amount_with_gst"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_totp_status"() RETURNS TABLE("user_id" "uuid", "totp_enabled" boolean, "active_accounts_count" bigint, "status" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.user_id,
        ut.totp_enabled,
        COUNT(ta.id) as active_accounts_count,
        CASE 
            WHEN COUNT(ta.id) > 0 AND ut.totp_enabled = true THEN 'Correct - Active accounts and enabled'
            WHEN COUNT(ta.id) = 0 AND ut.totp_enabled = false THEN 'Correct - No active accounts and disabled'
            WHEN COUNT(ta.id) > 0 AND ut.totp_enabled = false THEN 'ERROR - Has active accounts but disabled'
            WHEN COUNT(ta.id) = 0 AND ut.totp_enabled = true THEN 'ERROR - No active accounts but enabled'
            ELSE 'Unknown status'
        END as status
    FROM user_totp ut
    LEFT JOIN totp_accounts ta ON ut.user_id = ta.user_id AND ta.is_active = true
    GROUP BY ut.user_id, ut.totp_enabled;
END;
$$;


ALTER FUNCTION "public"."check_totp_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_session_activities"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE user_session 
    SET activity_log = (
        SELECT jsonb_agg(activity ORDER BY (activity->>'timestamp')::timestamp DESC)
        FROM jsonb_array_elements(activity_log) activity
        LIMIT 50
    )
    WHERE jsonb_array_length(activity_log) > 50;
END;
$$;


ALTER FUNCTION "public"."clean_session_activities"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_totp_account"("p_user_id" "uuid", "p_account_name" "text", "p_issuer" "text", "p_secret_key" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    account_id UUID;
BEGIN
    -- Insert new account as unverified and inactive
    INSERT INTO totp_accounts (
        user_id, account_name, issuer, secret_key,
        is_verified, is_active
    ) VALUES (
        p_user_id, p_account_name, p_issuer, p_secret_key,
        false, false
    ) RETURNING id INTO account_id;
    
    -- Ensure user_totp record exists
    INSERT INTO user_totp (user_id, totp_enabled)
    VALUES (p_user_id, false)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN account_id;
END;
$$;


ALTER FUNCTION "public"."create_totp_account"("p_user_id" "uuid", "p_account_name" "text", "p_issuer" "text", "p_secret_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_totp_for_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Deactivate all accounts for the user
    UPDATE totp_accounts 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Clear sensitive data from user_totp
    UPDATE user_totp 
    SET totp_secret = NULL, totp_backup_codes = NULL, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."disable_totp_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_mobile_backup_codes"("user_uuid" "uuid", "count" integer DEFAULT 10) RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    FOR i IN 1..count LOOP
        -- Generate 12-character alphanumeric codes
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
        
        -- Insert the backup code
        INSERT INTO mobile_totp_backup_codes (user_id, backup_code)
        VALUES (user_uuid, code);
        
        codes := array_append(codes, code);
    END LOOP;
    RETURN codes;
END;
$$;


ALTER FUNCTION "public"."generate_mobile_backup_codes"("user_uuid" "uuid", "count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_user_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid", "count" integer DEFAULT 10) RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    FOR i IN 1..count LOOP
        -- Generate 8-character alphanumeric backup codes
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        codes := array_append(codes, code);
    END LOOP;
    
    -- Insert or update backup codes for the user/account
    INSERT INTO mobile_totp_backup_codes (user_id, account_id, backup_codes)
    VALUES (user_uuid, account_uuid, codes)
    ON CONFLICT (user_id, account_id)
    DO UPDATE SET 
        backup_codes = codes,
        used_codes = '{}',
        updated_at = NOW();
    
    RETURN codes;
END;
$$;


ALTER FUNCTION "public"."generate_user_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid", "count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_users_with_totp"() RETURNS TABLE("user_id" "uuid", "email" character varying, "name" character varying, "role" character varying, "totp_accounts_count" bigint, "last_login" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        up.name,
        ur.role,
        COUNT(mta.id) as totp_accounts_count,
        au.updated_at as last_login
    FROM auth_user au
    LEFT JOIN user_profiles up ON au.id = up.user_id
    LEFT JOIN user_roles ur ON au.id = ur.user_id AND ur.is_active = true
    LEFT JOIN mobile_totp_accounts mta ON au.id = mta.user_id AND mta.is_active = true
    WHERE ur.role = 'admin'
    GROUP BY au.id, au.email, up.name, ur.role, au.updated_at
    ORDER BY au.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_users_with_totp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_settings"() RETURNS TABLE("setting_key" character varying, "setting_value" "text", "setting_type" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT ss.setting_key, ss.setting_value, ss.setting_type
    FROM site_settings ss
    WHERE ss.is_public = true;
END;
$$;


ALTER FUNCTION "public"."get_public_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_totp_status"("p_user_id" "uuid") RETURNS TABLE("totp_enabled" boolean, "verified_accounts_count" bigint, "active_accounts_count" bigint, "total_accounts_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.totp_enabled,
        COUNT(CASE WHEN ta.is_verified = true THEN 1 END) as verified_accounts_count,
        COUNT(CASE WHEN ta.is_active = true THEN 1 END) as active_accounts_count,
        COUNT(*) as total_accounts_count
    FROM user_totp ut
    LEFT JOIN totp_accounts ta ON ut.user_id = ta.user_id
    WHERE ut.user_id = p_user_id
    GROUP BY ut.totp_enabled;
END;
$$;


ALTER FUNCTION "public"."get_totp_status"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unused_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    unused_codes TEXT[];
BEGIN
    SELECT array(
        SELECT unnest(backup_codes) 
        EXCEPT 
        SELECT unnest(used_codes)
    ) INTO unused_codes
    FROM mobile_totp_backup_codes 
    WHERE user_id = user_uuid 
    AND account_id = account_uuid;
    
    RETURN COALESCE(unused_codes, '{}');
END;
$$;


ALTER FUNCTION "public"."get_unused_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_mobile_totp_accounts"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "account_name" character varying, "issuer" character varying, "algorithm" character varying, "digits" integer, "period" integer, "is_active" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mta.id,
        mta.account_name,
        mta.issuer,
        mta.algorithm,
        mta.digits,
        mta.period,
        mta.is_active,
        mta.created_at
    FROM mobile_totp_accounts mta
    WHERE mta.user_id = user_uuid AND mta.is_active = true
    ORDER BY mta.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_mobile_totp_accounts"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_session_with_activity"("user_id_param" character varying) RETURNS TABLE("id" character varying, "user_id" character varying, "expires_at" timestamp with time zone, "last_activity" timestamp with time zone, "recent_activities" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.expires_at,
        us.last_activity,
        -- Get last 10 activities
        (SELECT jsonb_agg(activity ORDER BY (activity->>'timestamp')::timestamp DESC)
         FROM jsonb_array_elements(us.activity_log) activity
         LIMIT 10) as recent_activities,
        us.created_at
    FROM user_session us
    WHERE us.user_id = user_id_param;
END;
$$;


ALTER FUNCTION "public"."get_user_session_with_activity"("user_id_param" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_unused_backup_codes_count"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM mobile_totp_backup_codes
    WHERE user_id = user_uuid AND is_used = false;
    
    RETURN count;
END;
$$;


ALTER FUNCTION "public"."get_user_unused_backup_codes_count"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_verification_history"("user_uuid" "uuid", "days_back" integer DEFAULT 30) RETURNS TABLE("id" "uuid", "code_used" character varying, "is_valid" boolean, "ip_address" "inet", "user_agent" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mtv.id,
        mtv.code_used,
        mtv.is_valid,
        mtv.ip_address,
        mtv.user_agent,
        mtv.created_at
    FROM mobile_totp_verifications mtv
    WHERE mtv.user_id = user_uuid
    AND mtv.created_at >= NOW() - INTERVAL '1 day' * days_back
    ORDER BY mtv.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_verification_history"("user_uuid" "uuid", "days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.user_profiles (id, username, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'name', 'User')
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_totp_account_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only affect totp_enabled if the deleted account was active
    IF OLD.is_active = true THEN
        UPDATE user_totp 
        SET totp_enabled = EXISTS (
            SELECT 1 FROM totp_accounts 
            WHERE user_id = OLD.user_id 
            AND is_active = true
            AND id != OLD.id
        )
        WHERE user_id = OLD.user_id;
        RAISE NOTICE 'TOTP status updated for user % due to active account deletion', OLD.user_id;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_totp_account_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_totp_account_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- This function should ONLY be called for active accounts due to WHEN clause
    -- Double-check to be absolutely sure
    IF NEW.is_active = true THEN
        UPDATE user_totp 
        SET totp_enabled = true
        WHERE user_id = NEW.user_id;
        RAISE NOTICE 'TOTP enabled for user % due to active account creation', NEW.user_id;
    ELSE
        RAISE NOTICE 'TOTP NOT enabled for user % - account created as inactive', NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_totp_account_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_totp_account_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only handle the case where account becomes active
    IF OLD.is_active = false AND NEW.is_active = true THEN
        UPDATE user_totp 
        SET totp_enabled = true
        WHERE user_id = NEW.user_id;
        RAISE NOTICE 'TOTP enabled for user % due to account activation', NEW.user_id;
    ELSIF OLD.is_active = true AND NEW.is_active = false THEN
        -- Account is being deactivated, check if user has other active accounts
        UPDATE user_totp 
        SET totp_enabled = EXISTS (
            SELECT 1 FROM totp_accounts 
            WHERE user_id = NEW.user_id 
            AND is_active = true
            AND id != NEW.id
        )
        WHERE user_id = NEW.user_id;
        RAISE NOTICE 'TOTP status updated for user % due to account deactivation', NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_totp_account_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_mobile_totp_accounts"("p_user_id" "uuid", "p_action" "text", "p_account_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only allow service role or authenticated users to call this function
    IF auth.role() != 'service_role' AND auth.uid()::uuid != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;

    CASE p_action
        WHEN 'insert_account' THEN
            INSERT INTO mobile_totp_accounts (
                user_id,
                account_name,
                issuer,
                secret_key,
                algorithm,
                digits,
                period,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                p_user_id,
                (p_account_data->>'account_name')::TEXT,
                (p_account_data->>'issuer')::TEXT,
                (p_account_data->>'secret_key')::TEXT,
                (p_account_data->>'algorithm')::TEXT,
                (p_account_data->>'digits')::INTEGER,
                (p_account_data->>'period')::INTEGER,
                (p_account_data->>'is_active')::BOOLEAN,
                NOW(),
                NOW()
            ) RETURNING to_jsonb(mobile_totp_accounts.*) INTO result;
            
        WHEN 'insert_backup_code' THEN
            INSERT INTO mobile_totp_backup_codes (
                user_id,
                backup_code,
                is_used,
                created_at
            ) VALUES (
                p_user_id,
                (p_account_data->>'backup_code')::TEXT,
                FALSE,
                NOW()
            );
            result := '{"success": true}'::JSONB;
            
        WHEN 'get_accounts' THEN
            SELECT jsonb_agg(to_jsonb(mobile_totp_accounts.*))
            INTO result
            FROM mobile_totp_accounts
            WHERE user_id = p_user_id AND is_active = true;
            
        WHEN 'get_backup_codes' THEN
            SELECT jsonb_agg(to_jsonb(mobile_totp_backup_codes.*))
            INTO result
            FROM mobile_totp_backup_codes
            WHERE user_id = p_user_id AND is_used = false;
            
        WHEN 'use_backup_code' THEN
            UPDATE mobile_totp_backup_codes
            SET is_used = true
            WHERE user_id = p_user_id 
              AND backup_code = (p_account_data->>'backup_code')::TEXT
              AND is_used = false;
            result := '{"success": true}'::JSONB;
            
        ELSE
            RAISE EXCEPTION 'Invalid action: %', p_action;
    END CASE;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."manage_mobile_totp_accounts"("p_user_id" "uuid", "p_action" "text", "p_account_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_user_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    user_record RECORD;
    has_username BOOLEAN := false;
    has_name BOOLEAN := false;
    has_avatar_url BOOLEAN := false;
    has_role BOOLEAN := false;
    has_totp_secret BOOLEAN := false;
    has_totp_enabled BOOLEAN := false;
    has_totp_backup_codes BOOLEAN := false;
    has_is_activated BOOLEAN := false;
    has_provider BOOLEAN := false;
    username_val TEXT;
    name_val TEXT;
    avatar_url_val TEXT;
    role_val TEXT;
    totp_secret_val TEXT;
    totp_enabled_val BOOLEAN;
    totp_backup_codes_val TEXT[];
    is_activated_val BOOLEAN;
    provider_val TEXT;
    has_totp_data BOOLEAN := false;
BEGIN
    -- Check which columns actually exist in the backup table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'username'
    ) INTO has_username;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'name'
    ) INTO has_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'avatar_url'
    ) INTO has_avatar_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'role'
    ) INTO has_role;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'totp_secret'
    ) INTO has_totp_secret;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'totp_enabled'
    ) INTO has_totp_enabled;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'totp_backup_codes'
    ) INTO has_totp_backup_codes;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'is_activated'
    ) INTO has_is_activated;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user_backup' AND column_name = 'provider'
    ) INTO has_provider;

    RAISE NOTICE 'Column check results: username=%, name=%, avatar_url=%, role=%, totp_secret=%, totp_enabled=%, totp_backup_codes=%, is_activated=%, provider=%', 
        has_username, has_name, has_avatar_url, has_role, has_totp_secret, has_totp_enabled, has_totp_backup_codes, has_is_activated, has_provider;

    -- Migrate data from backup to new structure
    FOR user_record IN SELECT * FROM auth_user_backup LOOP
        -- Extract values safely based on what columns exist
        IF has_username THEN
            username_val := user_record.username;
        ELSE
            username_val := 'user_' || substr(user_record.id::text, 1, 8);
        END IF;
        
        IF has_name THEN
            name_val := user_record.name;
        ELSE
            name_val := 'User';
        END IF;
        
        IF has_avatar_url THEN
            avatar_url_val := user_record.avatar_url;
        ELSE
            avatar_url_val := NULL;
        END IF;
        
        IF has_role THEN
            role_val := user_record.role;
        ELSE
            role_val := 'user';
        END IF;
        
        IF has_totp_secret THEN
            totp_secret_val := user_record.totp_secret;
        ELSE
            totp_secret_val := NULL;
        END IF;
        
        IF has_totp_enabled THEN
            totp_enabled_val := user_record.totp_enabled;
        ELSE
            totp_enabled_val := false;
        END IF;
        
        IF has_totp_backup_codes THEN
            totp_backup_codes_val := user_record.totp_backup_codes;
        ELSE
            totp_backup_codes_val := '{}';
        END IF;
        
        IF has_is_activated THEN
            is_activated_val := user_record.is_activated;
        ELSE
            is_activated_val := true; -- Assume activated if no activation column existed
        END IF;
        
        IF has_provider THEN
            provider_val := user_record.provider;
        ELSE
            provider_val := 'password';
        END IF;

        -- Check if we have actual TOTP data to migrate
        has_totp_data := (has_totp_secret AND totp_secret_val IS NOT NULL) OR 
                        (has_totp_enabled AND totp_enabled_val = true);

        -- Insert into simplified auth_user
        INSERT INTO auth_user (id, email, created_at, updated_at, provider)
        VALUES (
            user_record.id,
            user_record.email,
            COALESCE(user_record.created_at, NOW()),
            COALESCE(user_record.updated_at, NOW()),
            provider_val
        );

        -- Insert into user_profiles
        INSERT INTO user_profiles (user_id, username, name, avatar_url)
        VALUES (
            user_record.id,
            username_val,
            name_val,
            avatar_url_val
        );

        -- Insert into user_roles
        INSERT INTO user_roles (user_id, role)
        VALUES (
            user_record.id,
            role_val
        );

        -- Insert into user_activation
        INSERT INTO user_activation (user_id, activation_token, is_activated, activated_at, expires_at)
        VALUES (
            user_record.id,
            gen_random_uuid()::text,
            is_activated_val,
            CASE 
                WHEN is_activated_val THEN NOW()
                ELSE NULL
            END,
            NOW() + INTERVAL '24 hours'
        );

        -- Insert into user_totp ONLY if we have actual TOTP data
        IF has_totp_data THEN
            INSERT INTO user_totp (user_id, totp_secret, totp_enabled, totp_backup_codes)
            VALUES (
                user_record.id,
                totp_secret_val,
                totp_enabled_val,
                totp_backup_codes_val
            );
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully. Processed % users.', (SELECT COUNT(*) FROM auth_user);
END;
$$;


ALTER FUNCTION "public"."migrate_user_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_totp_enabled_status"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE user_totp 
    SET totp_enabled = EXISTS (
        SELECT 1 FROM totp_accounts 
        WHERE totp_accounts.user_id = user_totp.user_id 
        AND totp_accounts.is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."sync_totp_enabled_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_trek_gallery"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_trek_gallery(OLD.trek_slug);
        RETURN OLD;
    ELSE
        PERFORM update_trek_gallery(NEW.trek_slug);
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."trigger_update_trek_gallery"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_app_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_app_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_blogs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_blogs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_bookings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_bookings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chat_histories_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_chat_histories_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_maintenance_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_maintenance_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_session_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_site_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_site_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_slot_booked_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update booked count for the slot
    IF TG_OP = 'INSERT' THEN
        UPDATE trek_slots 
        SET booked = booked + NEW.participants,
            status = CASE 
                WHEN (booked + NEW.participants) >= capacity THEN 'full'
                ELSE 'open'
            END
        WHERE id = NEW.slot_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle booking updates (e.g., changing participants)
        UPDATE trek_slots 
        SET booked = booked - OLD.participants + NEW.participants,
            status = CASE 
                WHEN (booked - OLD.participants + NEW.participants) >= capacity THEN 'full'
                ELSE 'open'
            END
        WHERE id = NEW.slot_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Handle booking cancellations
        UPDATE trek_slots 
        SET booked = booked - OLD.participants,
            status = CASE 
                WHEN (booked - OLD.participants) < capacity THEN 'open'
                ELSE 'full'
            END
        WHERE id = OLD.slot_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_slot_booked_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_totp_enabled_from_accounts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update user_totp.totp_enabled based on whether user has any verified and active accounts
    UPDATE user_totp 
    SET totp_enabled = EXISTS (
        SELECT 1 FROM totp_accounts 
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND is_verified = true 
        AND is_active = true
    )
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_totp_enabled_from_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trek_gallery"("trek_slug_param" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE trek_dynamic_data 
    SET gallery = (
        SELECT json_agg(
            json_build_object(
                'id', ti.id,
                'url', ti.image_url,
                'alt', ti.alt_text,
                'caption', ti.caption,
                'sort_order', ti.sort_order,
                'is_featured', ti.is_featured
            ) ORDER BY ti.sort_order, ti.created_at
        )
        FROM trek_images ti
        WHERE ti.trek_slug = trek_slug_param
    )
    WHERE trek_slug = trek_slug_param;
END;
$$;


ALTER FUNCTION "public"."update_trek_gallery"("trek_slug_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trek_slots_created_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trek_slots_created_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trek_slots_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trek_slots_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE mobile_totp_backup_codes 
    SET used_codes = array_append(used_codes, backup_code),
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND account_id = account_uuid
    AND backup_code = ANY(backup_codes)
    AND NOT (backup_code = ANY(used_codes));
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;


ALTER FUNCTION "public"."use_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE mobile_totp_backup_codes 
    SET is_used = true, used_at = NOW()
    WHERE user_id = user_uuid 
    AND backup_code = upper(backup_code) 
    AND is_used = false;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;


ALTER FUNCTION "public"."use_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_active_totp"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    account_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO account_count
    FROM mobile_totp_accounts
    WHERE user_id = user_uuid AND is_active = true;
    
    RETURN account_count > 0;
END;
$$;


ALTER FUNCTION "public"."user_has_active_totp"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    code_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM mobile_totp_backup_codes 
        WHERE user_id = user_uuid 
        AND account_id = account_uuid
        AND backup_code = ANY(backup_codes)
        AND NOT (backup_code = ANY(used_codes))
    ) INTO code_exists;
    
    RETURN code_exists;
END;
$$;


ALTER FUNCTION "public"."validate_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    code_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM mobile_totp_backup_codes 
        WHERE user_id = user_uuid 
        AND backup_code = upper(backup_code) 
        AND is_used = false
    ) INTO code_exists;
    
    RETURN code_exists;
END;
$$;


ALTER FUNCTION "public"."validate_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_totp_account"("p_user_id" "uuid", "p_account_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update account to verified and active
    UPDATE totp_accounts 
    SET is_verified = true, is_active = true, updated_at = NOW()
    WHERE id = p_account_id AND user_id = p_user_id;
    
    -- Return true if update was successful
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."verify_totp_account"("p_user_id" "uuid", "p_account_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_name" character varying(100) NOT NULL,
    "metric_value" "jsonb" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_dashboard_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "dashboard_layout" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "preferred_metrics" "text"[] DEFAULT '{}'::"text"[],
    "refresh_interval" integer DEFAULT 300,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_dashboard_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_response_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_response_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_user" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "provider" character varying(50) DEFAULT 'password'::character varying NOT NULL,
    CONSTRAINT "auth_user_provider_check" CHECK ((("provider")::"text" = ANY ((ARRAY['password'::character varying, 'google'::character varying, 'github'::character varying, 'facebook'::character varying])::"text"[])))
);


ALTER TABLE "public"."auth_user" OWNER TO "postgres";


COMMENT ON COLUMN "public"."auth_user"."provider" IS 'Auth provider (e.g. password, google, etc)';



CREATE TABLE IF NOT EXISTS "public"."trek_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trek_slug" "text" NOT NULL,
    "date" "date" NOT NULL,
    "capacity" integer DEFAULT 10 NOT NULL,
    "booked" integer DEFAULT 0 NOT NULL,
    "status" character varying(16) DEFAULT 'open'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trek_slots_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'full'::character varying, 'closed'::character varying])::"text"[])))
);


ALTER TABLE "public"."trek_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "region" "text",
    "difficulty" "text",
    "duration" "text",
    "price" numeric DEFAULT 0,
    "rating" numeric DEFAULT 0,
    "image" "text",
    "featured" boolean DEFAULT false,
    "status" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treks" OWNER TO "postgres";


COMMENT ON TABLE "public"."treks" IS 'Trek prices include 5% GST. Base amount + GST = Total price.';



CREATE OR REPLACE VIEW "public"."available_slots" AS
 SELECT "ts"."id" AS "slot_id",
    "ts"."trek_slug",
    "t"."name" AS "trek_name",
    "ts"."date",
    "ts"."capacity",
    "ts"."booked",
    ("ts"."capacity" - "ts"."booked") AS "available_spots",
    "ts"."status",
    "t"."price",
    "t"."rating"
   FROM ("public"."trek_slots" "ts"
     JOIN "public"."treks" "t" ON (("ts"."trek_slug" = "t"."slug")))
  WHERE ((("ts"."status")::"text" = 'open'::"text") AND ("ts"."capacity" > "ts"."booked") AND ("t"."status" = true))
  ORDER BY "ts"."date", "t"."name";


ALTER VIEW "public"."available_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "content" "text",
    "image" "text",
    "author" "text",
    "category" "text",
    "read_time" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blogs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "document_type" character varying(50) NOT NULL,
    "file_url" "text" NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_size" integer,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_documents_document_type_check" CHECK ((("document_type")::"text" = ANY ((ARRAY['id_proof'::character varying, 'medical_certificate'::character varying, 'liability_waiver'::character varying, 'covid_declaration'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."booking_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "full_name" character varying(255) NOT NULL,
    "age" integer NOT NULL,
    "gender" character varying(20),
    "contact_number" character varying(20),
    "email_address" character varying(255),
    "id_proof_type" character varying(50),
    "id_proof_number" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_participants_gender_check" CHECK ((("gender")::"text" = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying, 'prefer_not_to_say'::character varying])::"text"[]))),
    CONSTRAINT "booking_participants_id_proof_type_check" CHECK ((("id_proof_type")::"text" = ANY ((ARRAY['aadhaar'::character varying, 'passport'::character varying, 'driving_license'::character varying, 'pan_card'::character varying, 'voter_id'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."booking_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "trek_slug" "text" NOT NULL,
    "slot_id" "uuid",
    "booking_date" "date" NOT NULL,
    "participants" integer NOT NULL,
    "base_amount" numeric(10,2) NOT NULL,
    "gst_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "customer_name" character varying(255) NOT NULL,
    "customer_email" character varying(255) NOT NULL,
    "customer_phone" character varying(20) NOT NULL,
    "customer_dob" "date",
    "customer_gender" character varying(20),
    "customer_nationality" character varying(100),
    "emergency_contact_name" character varying(255),
    "emergency_contact_phone" character varying(20),
    "medical_conditions" "text",
    "recent_illnesses" "text",
    "current_medications" "text",
    "trekking_experience" character varying(50),
    "fitness_consent" boolean DEFAULT false,
    "residential_address" "text",
    "id_proof_type" character varying(50),
    "id_proof_number" character varying(100),
    "id_proof_file_url" "text",
    "needs_transportation" boolean DEFAULT false,
    "pickup_point" "text",
    "accommodation_preferences" "text",
    "terms_accepted" boolean DEFAULT false,
    "liability_waiver_accepted" boolean DEFAULT false,
    "covid_declaration_accepted" boolean DEFAULT false,
    "trek_gear_rental" boolean DEFAULT false,
    "porter_services" boolean DEFAULT false,
    "addon_details" "jsonb",
    "special_requirements" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "advance_amount" numeric(10,2) DEFAULT 0,
    "remaining_amount" numeric(10,2) DEFAULT 0,
    "payment_type" character varying(20) DEFAULT 'full'::character varying,
    "payment_amount" numeric(10,2),
    "payment_intent_id" character varying(255),
    CONSTRAINT "bookings_customer_gender_check" CHECK ((("customer_gender")::"text" = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying, 'prefer_not_to_say'::character varying])::"text"[]))),
    CONSTRAINT "bookings_id_proof_type_check" CHECK ((("id_proof_type")::"text" = ANY ((ARRAY['aadhaar'::character varying, 'passport'::character varying, 'driving_license'::character varying, 'pan_card'::character varying, 'voter_id'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "bookings_participants_check" CHECK ((("participants" > 0) AND ("participants" <= 20))),
    CONSTRAINT "bookings_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'refunded'::character varying, 'failed'::character varying])::"text"[]))),
    CONSTRAINT "bookings_payment_type_check" CHECK ((("payment_type")::"text" = ANY ((ARRAY['advance'::character varying, 'full'::character varying])::"text"[]))),
    CONSTRAINT "bookings_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying])::"text"[]))),
    CONSTRAINT "bookings_trekking_experience_check" CHECK ((("trekking_experience")::"text" = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::"text"[])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_histories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "admin_joined" boolean DEFAULT false,
    "admin_joined_at" timestamp with time zone,
    "admin_joined_by" "uuid",
    "ai_suppressed" boolean DEFAULT false
);


ALTER TABLE "public"."chat_histories" OWNER TO "postgres";


COMMENT ON COLUMN "public"."chat_histories"."admin_joined" IS 'Whether an admin has joined this chat';



COMMENT ON COLUMN "public"."chat_histories"."admin_joined_at" IS 'When the admin joined the chat';



COMMENT ON COLUMN "public"."chat_histories"."admin_joined_by" IS 'Which admin joined the chat';



COMMENT ON COLUMN "public"."chat_histories"."ai_suppressed" IS 'Whether AI responses are suppressed due to admin presence';



CREATE TABLE IF NOT EXISTS "public"."chat_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_url" "text" NOT NULL,
    "caption" "text",
    "trek_id" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gallery" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_url" "text" NOT NULL,
    "caption" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."gallery_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_maintenance_mode" boolean DEFAULT false NOT NULL,
    "maintenance_message" "text" DEFAULT 'Site is under maintenance. Please check back later.'::"text" NOT NULL,
    "emergency_bypass_token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."maintenance_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobile_totp_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_name" character varying(255) NOT NULL,
    "issuer" character varying(255) DEFAULT 'TrekkingWebsite'::character varying NOT NULL,
    "secret_key" "text" NOT NULL,
    "algorithm" character varying(10) DEFAULT 'SHA1'::character varying NOT NULL,
    "digits" integer DEFAULT 6 NOT NULL,
    "period" integer DEFAULT 30 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mobile_totp_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."mobile_totp_accounts" IS 'Mobile TOTP accounts for users, compatible with Google Authenticator and similar apps';



COMMENT ON COLUMN "public"."mobile_totp_accounts"."secret_key" IS 'Base32 encoded TOTP secret key';



COMMENT ON COLUMN "public"."mobile_totp_accounts"."algorithm" IS 'TOTP algorithm (SHA1, SHA256, SHA512)';



COMMENT ON COLUMN "public"."mobile_totp_accounts"."digits" IS 'Number of digits in TOTP code (usually 6)';



COMMENT ON COLUMN "public"."mobile_totp_accounts"."period" IS 'Time period in seconds for TOTP code generation (usually 30)';



CREATE TABLE IF NOT EXISTS "public"."mobile_totp_backup_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_id" "uuid",
    "backup_codes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "used_codes" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mobile_totp_backup_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."mobile_totp_backup_codes" IS 'Backup codes for TOTP account recovery - single row per user/account';



COMMENT ON COLUMN "public"."mobile_totp_backup_codes"."user_id" IS 'User ID who owns these backup codes';



COMMENT ON COLUMN "public"."mobile_totp_backup_codes"."account_id" IS 'TOTP account ID these backup codes belong to';



COMMENT ON COLUMN "public"."mobile_totp_backup_codes"."backup_codes" IS 'Array of backup codes for account recovery';



COMMENT ON COLUMN "public"."mobile_totp_backup_codes"."used_codes" IS 'Array of used backup codes';



CREATE TABLE IF NOT EXISTS "public"."mobile_totp_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "totp_account_id" "uuid",
    "code_used" character varying(50) NOT NULL,
    "is_valid" boolean DEFAULT false NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mobile_totp_verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."mobile_totp_verifications" IS 'Log of TOTP verification attempts for audit purposes';



COMMENT ON COLUMN "public"."mobile_totp_verifications"."code_used" IS 'The code that was used (TOTP code, backup code, or special values like SETUP/DISABLE)';



COMMENT ON COLUMN "public"."mobile_totp_verifications"."is_valid" IS 'Whether the verification was successful';



CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "website" "text",
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."password_reset_ip_log" (
    "id" integer NOT NULL,
    "ip" character varying(64) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."password_reset_ip_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."password_reset_ip_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."password_reset_ip_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."password_reset_ip_log_id_seq" OWNED BY "public"."password_reset_ip_log"."id";



CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" character varying(255) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "used_at" timestamp with time zone,
    "is_used" boolean DEFAULT false
);


ALTER TABLE "public"."password_reset_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "stripe_payment_intent_id" "text",
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'INR'::character varying,
    "payment_type" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "payment_method" "text",
    "customer_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_transactions_payment_type_check" CHECK ((("payment_type")::"text" = ANY ((ARRAY['advance'::character varying, 'full'::character varying, 'remaining'::character varying])::"text"[]))),
    CONSTRAINT "payment_transactions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trek_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trek_id" "uuid",
    "image_url" "text" NOT NULL,
    "alt_text" "text",
    "caption" "text",
    "is_featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trek_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trek_leaders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "photo" "text",
    "bio" "text",
    "experience_years" integer,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."trek_leaders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."trek_price_breakdown" AS
 SELECT "slug" AS "trek_slug",
    "price" AS "total_price_with_gst",
    "round"(("price" / 1.05), 2) AS "base_price",
    "round"(("price" - ("price" / 1.05)), 2) AS "gst_amount",
    '5%'::"text" AS "gst_percentage"
   FROM "public"."treks"
  WHERE ("price" > (0)::numeric);


ALTER VIEW "public"."trek_price_breakdown" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activation_token" character varying(255) NOT NULL,
    "is_activated" boolean DEFAULT false,
    "activated_at" timestamp with time zone,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_key" (
    "id" character varying(255) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "hashed_password" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_key" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "username" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "avatar_url" "text",
    "phone" character varying(20),
    "date_of_birth" "date",
    "gender" character varying(10),
    "bio" "text",
    "location" character varying(255),
    "website" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_profiles_gender_check" CHECK ((("gender")::"text" = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying, 'prefer_not_to_say'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(16) DEFAULT 'user'::character varying NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'moderator'::character varying, 'user'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_session" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "activity_log" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "discount_percent" integer,
    "valid_until" timestamp without time zone,
    "is_used" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."vouchers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "trek_id" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


COMMENT ON TABLE "public"."wishlists" IS 'User wishlist items linking users to their favorite treks';



COMMENT ON COLUMN "public"."wishlists"."id" IS 'Unique identifier for wishlist item';



COMMENT ON COLUMN "public"."wishlists"."user_id" IS 'Reference to auth_user.id';



COMMENT ON COLUMN "public"."wishlists"."trek_id" IS 'Reference to treks.id';



COMMENT ON COLUMN "public"."wishlists"."created_at" IS 'When the item was added to wishlist';



ALTER TABLE ONLY "public"."password_reset_ip_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."password_reset_ip_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_analytics"
    ADD CONSTRAINT "admin_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_analytics"
    ADD CONSTRAINT "admin_analytics_user_id_metric_name_period_start_key" UNIQUE ("user_id", "metric_name", "period_start");



ALTER TABLE ONLY "public"."admin_dashboard_settings"
    ADD CONSTRAINT "admin_dashboard_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_dashboard_settings"
    ADD CONSTRAINT "admin_dashboard_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."ai_response_cache"
    ADD CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_user"
    ADD CONSTRAINT "auth_user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."auth_user"
    ADD CONSTRAINT "auth_user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."booking_documents"
    ADD CONSTRAINT "booking_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_participants"
    ADD CONSTRAINT "booking_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_histories"
    ADD CONSTRAINT "chat_histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery"
    ADD CONSTRAINT "gallery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_settings"
    ADD CONSTRAINT "maintenance_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_totp_accounts"
    ADD CONSTRAINT "mobile_totp_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_totp_backup_codes"
    ADD CONSTRAINT "mobile_totp_backup_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_totp_backup_codes"
    ADD CONSTRAINT "mobile_totp_backup_codes_user_id_account_id_key" UNIQUE ("user_id", "account_id");



ALTER TABLE ONLY "public"."mobile_totp_verifications"
    ADD CONSTRAINT "mobile_totp_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_ip_log"
    ADD CONSTRAINT "password_reset_ip_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."trek_images"
    ADD CONSTRAINT "trek_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trek_leaders"
    ADD CONSTRAINT "trek_leaders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trek_slots"
    ADD CONSTRAINT "trek_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treks"
    ADD CONSTRAINT "treks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treks"
    ADD CONSTRAINT "treks_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_activation"
    ADD CONSTRAINT "user_activation_activation_token_key" UNIQUE ("activation_token");



ALTER TABLE ONLY "public"."user_activation"
    ADD CONSTRAINT "user_activation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_key"
    ADD CONSTRAINT "user_key_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_session"
    ADD CONSTRAINT "user_session_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."user_session"
    ADD CONSTRAINT "user_session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_trek_id_key" UNIQUE ("user_id", "trek_id");



CREATE INDEX "idx_admin_analytics_metric_name" ON "public"."admin_analytics" USING "btree" ("metric_name");



CREATE INDEX "idx_admin_analytics_user_id" ON "public"."admin_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_ai_response_cache_created_at" ON "public"."ai_response_cache" USING "btree" ("created_at");



CREATE INDEX "idx_ai_response_cache_question" ON "public"."ai_response_cache" USING "btree" ("question");



CREATE INDEX "idx_auth_user_created_at" ON "public"."auth_user" USING "btree" ("created_at");



CREATE INDEX "idx_auth_user_email" ON "public"."auth_user" USING "btree" ("email");



CREATE INDEX "idx_auth_user_provider" ON "public"."auth_user" USING "btree" ("provider");



CREATE INDEX "idx_booking_documents_booking_id" ON "public"."booking_documents" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_documents_type" ON "public"."booking_documents" USING "btree" ("document_type");



CREATE INDEX "idx_booking_participants_booking_id" ON "public"."booking_participants" USING "btree" ("booking_id");



CREATE INDEX "idx_bookings_booking_date" ON "public"."bookings" USING "btree" ("booking_date");



CREATE INDEX "idx_bookings_created_at" ON "public"."bookings" USING "btree" ("created_at");



CREATE INDEX "idx_bookings_customer_email" ON "public"."bookings" USING "btree" ("customer_email");



CREATE INDEX "idx_bookings_payment_status" ON "public"."bookings" USING "btree" ("payment_status");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_trek_slug" ON "public"."bookings" USING "btree" ("trek_slug");



CREATE INDEX "idx_bookings_user_id" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_chat_histories_admin_joined" ON "public"."chat_histories" USING "btree" ("admin_joined");



CREATE INDEX "idx_chat_histories_ai_suppressed" ON "public"."chat_histories" USING "btree" ("ai_suppressed");



CREATE INDEX "idx_chat_histories_created_at" ON "public"."chat_histories" USING "btree" ("created_at");



CREATE INDEX "idx_chat_histories_user_id" ON "public"."chat_histories" USING "btree" ("user_id");



CREATE INDEX "idx_mobile_totp_accounts_active" ON "public"."mobile_totp_accounts" USING "btree" ("is_active");



CREATE INDEX "idx_mobile_totp_accounts_issuer" ON "public"."mobile_totp_accounts" USING "btree" ("issuer");



CREATE INDEX "idx_mobile_totp_accounts_user_id" ON "public"."mobile_totp_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_mobile_totp_backup_codes_account_id" ON "public"."mobile_totp_backup_codes" USING "btree" ("account_id");



CREATE INDEX "idx_mobile_totp_backup_codes_user_id" ON "public"."mobile_totp_backup_codes" USING "btree" ("user_id");



CREATE INDEX "idx_mobile_totp_verifications_account_id" ON "public"."mobile_totp_verifications" USING "btree" ("totp_account_id");



CREATE INDEX "idx_mobile_totp_verifications_created_at" ON "public"."mobile_totp_verifications" USING "btree" ("created_at");



CREATE INDEX "idx_mobile_totp_verifications_user_id" ON "public"."mobile_totp_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_mobile_totp_verifications_valid" ON "public"."mobile_totp_verifications" USING "btree" ("is_valid");



CREATE INDEX "idx_password_reset_tokens_expires_at" ON "public"."password_reset_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_password_reset_tokens_token" ON "public"."password_reset_tokens" USING "btree" ("token");



CREATE INDEX "idx_password_reset_tokens_user_id" ON "public"."password_reset_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_payment_transactions_booking_id" ON "public"."payment_transactions" USING "btree" ("booking_id");



CREATE INDEX "idx_payment_transactions_created_at" ON "public"."payment_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_payment_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");



CREATE INDEX "idx_payment_transactions_stripe_payment_intent_id" ON "public"."payment_transactions" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_trek_images_is_featured" ON "public"."trek_images" USING "btree" ("is_featured");



CREATE INDEX "idx_trek_images_sort_order" ON "public"."trek_images" USING "btree" ("sort_order");



CREATE INDEX "idx_trek_images_trek_id" ON "public"."trek_images" USING "btree" ("trek_id");



CREATE INDEX "idx_trek_slots_date" ON "public"."trek_slots" USING "btree" ("date");



CREATE INDEX "idx_trek_slots_status" ON "public"."trek_slots" USING "btree" ("status");



CREATE INDEX "idx_trek_slots_trek_date" ON "public"."trek_slots" USING "btree" ("trek_slug", "date");



CREATE INDEX "idx_trek_slots_trek_slug" ON "public"."trek_slots" USING "btree" ("trek_slug");



CREATE INDEX "idx_treks_difficulty" ON "public"."treks" USING "btree" ("difficulty");



CREATE INDEX "idx_treks_featured" ON "public"."treks" USING "btree" ("featured");



CREATE INDEX "idx_treks_region" ON "public"."treks" USING "btree" ("region");



CREATE INDEX "idx_treks_slug" ON "public"."treks" USING "btree" ("slug");



CREATE INDEX "idx_treks_status" ON "public"."treks" USING "btree" ("status");



CREATE INDEX "idx_user_activation_expires_at" ON "public"."user_activation" USING "btree" ("expires_at");



CREATE INDEX "idx_user_activation_is_activated" ON "public"."user_activation" USING "btree" ("is_activated");



CREATE INDEX "idx_user_activation_token" ON "public"."user_activation" USING "btree" ("activation_token");



CREATE INDEX "idx_user_activation_user_id" ON "public"."user_activation" USING "btree" ("user_id");



CREATE INDEX "idx_user_key_id" ON "public"."user_key" USING "btree" ("id");



CREATE INDEX "idx_user_key_user_id" ON "public"."user_key" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_name" ON "public"."user_profiles" USING "btree" ("name");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_username" ON "public"."user_profiles" USING "btree" ("username");



CREATE INDEX "idx_user_roles_is_active" ON "public"."user_roles" USING "btree" ("is_active");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_user_session_activity_log" ON "public"."user_session" USING "gin" ("activity_log");



CREATE INDEX "idx_user_session_expires_at" ON "public"."user_session" USING "btree" ("expires_at");



CREATE INDEX "idx_user_session_last_activity" ON "public"."user_session" USING "btree" ("last_activity");



CREATE INDEX "idx_user_session_user_id" ON "public"."user_session" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "auto_confirm_booking_trigger" AFTER UPDATE ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."auto_confirm_booking_after_payment"();



CREATE OR REPLACE TRIGGER "calculate_total_amount_trigger" BEFORE INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_total_amount_with_gst"();



CREATE OR REPLACE TRIGGER "update_admin_dashboard_settings_updated_at" BEFORE UPDATE ON "public"."admin_dashboard_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_auth_user_updated_at" BEFORE UPDATE ON "public"."auth_user" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blogs_updated_at" BEFORE UPDATE ON "public"."blogs" FOR EACH ROW EXECUTE FUNCTION "public"."update_blogs_updated_at"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_histories_updated_at" BEFORE UPDATE ON "public"."chat_histories" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_histories_updated_at"();



CREATE OR REPLACE TRIGGER "update_maintenance_settings_updated_at" BEFORE UPDATE ON "public"."maintenance_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_maintenance_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_mobile_totp_accounts_updated_at" BEFORE UPDATE ON "public"."mobile_totp_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mobile_totp_backup_codes_updated_at" BEFORE UPDATE ON "public"."mobile_totp_backup_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_transactions_updated_at" BEFORE UPDATE ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trek_images_updated_at" BEFORE UPDATE ON "public"."trek_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trek_slots_updated_at" BEFORE UPDATE ON "public"."trek_slots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_treks_updated_at" BEFORE UPDATE ON "public"."treks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_activation_updated_at" BEFORE UPDATE ON "public"."user_activation" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_session_updated_at" BEFORE UPDATE ON "public"."user_session" FOR EACH ROW EXECUTE FUNCTION "public"."update_session_updated_at"();



ALTER TABLE ONLY "public"."admin_analytics"
    ADD CONSTRAINT "admin_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_dashboard_settings"
    ADD CONSTRAINT "admin_dashboard_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_documents"
    ADD CONSTRAINT "booking_documents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_participants"
    ADD CONSTRAINT "booking_participants_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."trek_slots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_histories"
    ADD CONSTRAINT "chat_histories_admin_joined_by_fkey" FOREIGN KEY ("admin_joined_by") REFERENCES "public"."auth_user"("id");



ALTER TABLE ONLY "public"."chat_histories"
    ADD CONSTRAINT "chat_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobile_totp_accounts"
    ADD CONSTRAINT "mobile_totp_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobile_totp_backup_codes"
    ADD CONSTRAINT "mobile_totp_backup_codes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."mobile_totp_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobile_totp_backup_codes"
    ADD CONSTRAINT "mobile_totp_backup_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobile_totp_verifications"
    ADD CONSTRAINT "mobile_totp_verifications_totp_account_id_fkey" FOREIGN KEY ("totp_account_id") REFERENCES "public"."mobile_totp_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mobile_totp_verifications"
    ADD CONSTRAINT "mobile_totp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trek_images"
    ADD CONSTRAINT "trek_images_trek_id_fkey" FOREIGN KEY ("trek_id") REFERENCES "public"."treks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trek_slots"
    ADD CONSTRAINT "trek_slots_trek_slug_fkey" FOREIGN KEY ("trek_slug") REFERENCES "public"."treks"("slug") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activation"
    ADD CONSTRAINT "user_activation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_key"
    ADD CONSTRAINT "user_key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_session"
    ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_trek_id_fkey" FOREIGN KEY ("trek_id") REFERENCES "public"."treks"("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id");



CREATE POLICY "Admins can insert maintenance settings" ON "public"."maintenance_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::"text"[])) AND ("ur"."is_active" = true)))));



CREATE POLICY "Admins can read maintenance settings" ON "public"."maintenance_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::"text"[])) AND ("ur"."is_active" = true)))));



CREATE POLICY "Admins can update maintenance settings" ON "public"."maintenance_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::"text"[])) AND ("ur"."is_active" = true)))));



CREATE POLICY "Admins can view all roles" ON "public"."user_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::"text"[])) AND ("ur"."is_active" = true)))));



CREATE POLICY "Authenticated users can manage their own mobile TOTP accounts" ON "public"."mobile_totp_accounts" USING ((("auth"."role"() = 'service_role'::"text") OR (("auth"."uid"() IS NOT NULL) AND ("auth"."uid"() = "user_id"))));



CREATE POLICY "Authenticated users can manage their own mobile TOTP verificati" ON "public"."mobile_totp_verifications" USING ((("auth"."role"() = 'service_role'::"text") OR (("auth"."uid"() IS NOT NULL) AND ("auth"."uid"() = "user_id"))));



CREATE POLICY "Public can view active treks" ON "public"."treks" FOR SELECT USING (("status" = true));



CREATE POLICY "Public can view cached responses" ON "public"."ai_response_cache" FOR SELECT USING (true);



CREATE POLICY "Public can view published blogs" ON "public"."blogs" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Public can view trek images" ON "public"."trek_images" FOR SELECT USING (true);



CREATE POLICY "Public can view trek slots" ON "public"."trek_slots" FOR SELECT USING (true);



CREATE POLICY "Service role can manage activations" ON "public"."user_activation" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all blogs" ON "public"."blogs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all bookings" ON "public"."bookings" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all chat histories" ON "public"."chat_histories" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all documents" ON "public"."booking_documents" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all participants" ON "public"."booking_participants" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all payment transactions" ON "public"."payment_transactions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all roles" ON "public"."user_roles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all trek images" ON "public"."trek_images" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all trek slots" ON "public"."trek_slots" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all treks" ON "public"."treks" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all vouchers" ON "public"."vouchers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all wishlist items" ON "public"."wishlists" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage auth users" ON "public"."auth_user" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage cached responses" ON "public"."ai_response_cache" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage mobile TOTP accounts" ON "public"."mobile_totp_accounts" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage mobile TOTP backup codes" ON "public"."mobile_totp_backup_codes" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage mobile TOTP verifications" ON "public"."mobile_totp_verifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage profiles" ON "public"."user_profiles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage reset tokens" ON "public"."password_reset_tokens" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage sessions" ON "public"."user_session" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage user keys" ON "public"."user_key" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can delete their own sessions" ON "public"."user_session" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own chat history" ON "public"."chat_histories" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own mobile TOTP backup codes" ON "public"."mobile_totp_backup_codes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage documents for their bookings" ON "public"."booking_documents" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_documents"."booking_id") AND ("bookings"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage participants for their bookings" ON "public"."booking_participants" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_participants"."booking_id") AND ("bookings"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own sessions" ON "public"."user_session" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bookings" ON "public"."bookings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own chat history" ON "public"."chat_histories" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own mobile TOTP backup codes" ON "public"."mobile_totp_backup_codes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own sessions" ON "public"."user_session" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activation status" ON "public"."user_activation" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own auth data" ON "public"."auth_user" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own chat history" ON "public"."chat_histories" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own keys" ON "public"."user_key" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own mobile TOTP backup codes" ON "public"."mobile_totp_backup_codes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own reset tokens" ON "public"."password_reset_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own sessions" ON "public"."user_session" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own vouchers" ON "public"."vouchers" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_response_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_histories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trek_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trek_leaders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trek_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_key" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vouchers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."auth_user";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."booking_documents";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."booking_participants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bookings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."mobile_totp_accounts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."mobile_totp_backup_codes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."mobile_totp_verifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_profiles";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_session_activity"("session_id" character varying, "activity_type" character varying, "activity_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_session_activity"("session_id" character varying, "activity_type" character varying, "activity_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_session_activity"("session_id" character varying, "activity_type" character varying, "activity_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."append_activity_log"("session_id" "uuid", "new_activity" "jsonb", "expires_at" timestamp with time zone, "last_activity" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."append_activity_log"("session_id" "uuid", "new_activity" "jsonb", "expires_at" timestamp with time zone, "last_activity" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."append_activity_log"("session_id" "uuid", "new_activity" "jsonb", "expires_at" timestamp with time zone, "last_activity" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_confirm_booking_after_payment"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_confirm_booking_after_payment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_confirm_booking_after_payment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_gst_amount"("base_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_gst_amount"("base_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_gst_amount"("base_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_payment_amounts"("total_amount" numeric, "payment_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_payment_amounts"("total_amount" numeric, "payment_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_payment_amounts"("total_amount" numeric, "payment_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_total_amount_with_gst"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_total_amount_with_gst"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_total_amount_with_gst"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_totp_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_totp_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_totp_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_session_activities"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_session_activities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_session_activities"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_totp_account"("p_user_id" "uuid", "p_account_name" "text", "p_issuer" "text", "p_secret_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_totp_account"("p_user_id" "uuid", "p_account_name" "text", "p_issuer" "text", "p_secret_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_totp_account"("p_user_id" "uuid", "p_account_name" "text", "p_issuer" "text", "p_secret_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."disable_totp_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."disable_totp_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_totp_for_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_mobile_backup_codes"("user_uuid" "uuid", "count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_mobile_backup_codes"("user_uuid" "uuid", "count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_mobile_backup_codes"("user_uuid" "uuid", "count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_user_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid", "count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_user_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid", "count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_user_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid", "count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users_with_totp"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users_with_totp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users_with_totp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_totp_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_totp_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_totp_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unused_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unused_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unused_backup_codes"("user_uuid" "uuid", "account_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_mobile_totp_accounts"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_mobile_totp_accounts"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_mobile_totp_accounts"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_session_with_activity"("user_id_param" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_session_with_activity"("user_id_param" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_session_with_activity"("user_id_param" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_unused_backup_codes_count"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_unused_backup_codes_count"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_unused_backup_codes_count"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_verification_history"("user_uuid" "uuid", "days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_verification_history"("user_uuid" "uuid", "days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_verification_history"("user_uuid" "uuid", "days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_totp_account_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_totp_account_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_totp_account_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_totp_account_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_totp_account_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_totp_account_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_totp_account_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_totp_account_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_totp_account_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_mobile_totp_accounts"("p_user_id" "uuid", "p_action" "text", "p_account_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."manage_mobile_totp_accounts"("p_user_id" "uuid", "p_action" "text", "p_account_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_mobile_totp_accounts"("p_user_id" "uuid", "p_action" "text", "p_account_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_user_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_user_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_user_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_totp_enabled_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_totp_enabled_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_totp_enabled_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_trek_gallery"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_trek_gallery"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_trek_gallery"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blogs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blogs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blogs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bookings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bookings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bookings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chat_histories_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_chat_histories_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chat_histories_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_maintenance_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_maintenance_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_maintenance_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_site_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_site_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_site_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_slot_booked_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_slot_booked_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_slot_booked_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_totp_enabled_from_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_totp_enabled_from_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_totp_enabled_from_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trek_gallery"("trek_slug_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_trek_gallery"("trek_slug_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trek_gallery"("trek_slug_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trek_slots_created_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_trek_slots_created_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trek_slots_created_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trek_slots_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_trek_slots_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trek_slots_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."use_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."use_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."use_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."use_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_active_totp"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_active_totp"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_active_totp"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_backup_code"("user_uuid" "uuid", "account_uuid" "uuid", "backup_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_mobile_backup_code"("user_uuid" "uuid", "backup_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_totp_account"("p_user_id" "uuid", "p_account_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_totp_account"("p_user_id" "uuid", "p_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_totp_account"("p_user_id" "uuid", "p_account_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."admin_analytics" TO "anon";
GRANT ALL ON TABLE "public"."admin_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."admin_dashboard_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_dashboard_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_dashboard_settings" TO "service_role";



GRANT ALL ON TABLE "public"."ai_response_cache" TO "anon";
GRANT ALL ON TABLE "public"."ai_response_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_response_cache" TO "service_role";



GRANT ALL ON TABLE "public"."auth_user" TO "anon";
GRANT ALL ON TABLE "public"."auth_user" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_user" TO "service_role";



GRANT ALL ON TABLE "public"."trek_slots" TO "anon";
GRANT ALL ON TABLE "public"."trek_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."trek_slots" TO "service_role";



GRANT ALL ON TABLE "public"."treks" TO "anon";
GRANT ALL ON TABLE "public"."treks" TO "authenticated";
GRANT ALL ON TABLE "public"."treks" TO "service_role";



GRANT ALL ON TABLE "public"."available_slots" TO "anon";
GRANT ALL ON TABLE "public"."available_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."available_slots" TO "service_role";



GRANT ALL ON TABLE "public"."blogs" TO "anon";
GRANT ALL ON TABLE "public"."blogs" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs" TO "service_role";



GRANT ALL ON TABLE "public"."booking_documents" TO "anon";
GRANT ALL ON TABLE "public"."booking_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_documents" TO "service_role";



GRANT ALL ON TABLE "public"."booking_participants" TO "anon";
GRANT ALL ON TABLE "public"."booking_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_participants" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."chat_histories" TO "anon";
GRANT ALL ON TABLE "public"."chat_histories" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_histories" TO "service_role";



GRANT ALL ON TABLE "public"."chat_sessions" TO "anon";
GRANT ALL ON TABLE "public"."chat_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."gallery" TO "anon";
GRANT ALL ON TABLE "public"."gallery" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_photos" TO "anon";
GRANT ALL ON TABLE "public"."gallery_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_photos" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_settings" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_settings" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_totp_accounts" TO "anon";
GRANT ALL ON TABLE "public"."mobile_totp_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_totp_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_totp_backup_codes" TO "anon";
GRANT ALL ON TABLE "public"."mobile_totp_backup_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_totp_backup_codes" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_totp_verifications" TO "anon";
GRANT ALL ON TABLE "public"."mobile_totp_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_totp_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_ip_log" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_ip_log" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_ip_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."password_reset_ip_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."password_reset_ip_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."password_reset_ip_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_tokens" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."trek_images" TO "anon";
GRANT ALL ON TABLE "public"."trek_images" TO "authenticated";
GRANT ALL ON TABLE "public"."trek_images" TO "service_role";



GRANT ALL ON TABLE "public"."trek_leaders" TO "anon";
GRANT ALL ON TABLE "public"."trek_leaders" TO "authenticated";
GRANT ALL ON TABLE "public"."trek_leaders" TO "service_role";



GRANT ALL ON TABLE "public"."trek_price_breakdown" TO "anon";
GRANT ALL ON TABLE "public"."trek_price_breakdown" TO "authenticated";
GRANT ALL ON TABLE "public"."trek_price_breakdown" TO "service_role";



GRANT ALL ON TABLE "public"."user_activation" TO "anon";
GRANT ALL ON TABLE "public"."user_activation" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activation" TO "service_role";



GRANT ALL ON TABLE "public"."user_key" TO "anon";
GRANT ALL ON TABLE "public"."user_key" TO "authenticated";
GRANT ALL ON TABLE "public"."user_key" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_session" TO "anon";
GRANT ALL ON TABLE "public"."user_session" TO "authenticated";
GRANT ALL ON TABLE "public"."user_session" TO "service_role";



GRANT ALL ON TABLE "public"."vouchers" TO "anon";
GRANT ALL ON TABLE "public"."vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."vouchers" TO "service_role";



GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

-- Fix auth_user table for Google OAuth
-- Run this in your Supabase SQL Editor

-- Add missing columns if they don't exist
-- Note: is_activated is in user_activation table, not auth_user
ALTER TABLE auth_user 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing users to have proper defaults
-- Set provider to 'email' for users without a provider
UPDATE auth_user 
SET provider = 'email'
WHERE provider IS NULL;

-- Ensure user_activation table exists for activation tracking
CREATE TABLE IF NOT EXISTS user_activation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth_user(id) ON DELETE CASCADE,
  is_activated BOOLEAN DEFAULT false,
  activated_at TIMESTAMP WITH TIME ZONE,
  activation_method VARCHAR(50), -- 'email', 'oauth_google', etc.
  activation_token UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_user_provider ON auth_user(provider);
CREATE INDEX IF NOT EXISTS idx_auth_user_email ON auth_user(email);
CREATE INDEX IF NOT EXISTS idx_user_activation_user_id ON user_activation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activation_is_activated ON user_activation(is_activated);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'auth_user' 
ORDER BY ordinal_position;

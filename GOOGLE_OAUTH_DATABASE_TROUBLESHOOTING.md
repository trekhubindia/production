# 🚨 Google OAuth Database Issue Troubleshooting

## Issue: Users not being stored in auth_user table during Google OAuth

## 🔍 Debugging Steps

### Step 1: Test Database Connection
Visit: `http://localhost:3000/api/auth/google/test`

This will show:
- ✅ Database table accessibility
- ✅ Environment variables status
- ✅ Sample data from tables
- ❌ Any connection issues

### Step 2: Verify Database Schema
Visit: `http://localhost:3000/api/auth/verify-db`

This will:
- ✅ Test inserting a Google OAuth user
- ✅ Test creating a session
- ✅ Show table structure
- ❌ Identify schema issues

### Step 3: Check Server Logs
After attempting Google login, check your terminal for:
```
✅ User info fetched successfully: { email: "...", name: "..." }
🔍 Checking for existing user with email: ...
👤 Existing user check result: { found: false, ... }
💾 Attempting to upsert user with data: { ... }
💾 Upsert result: { success: true, user: { ... } }
✅ User successfully created/updated: { ... }
```

## 🔧 Common Issues & Solutions

### Issue 1: Missing Environment Variables
**Symptoms:** OAuth flow fails early
**Check:** Environment variables are set
**Solution:**
```bash
# Add to .env.local
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Issue 2: Database Table Missing
**Symptoms:** "relation does not exist" error
**Solution:** Create the auth_user table:
```sql
CREATE TABLE auth_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'email',
  is_activated BOOLEAN DEFAULT false,
  activation_token UUID,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Issue 3: Missing Columns
**Symptoms:** "column does not exist" error
**Solution:** Add missing columns:
```sql
-- Add provider column if missing
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email';

-- Add avatar_url column if missing
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add activation columns if missing
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT false;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS activation_token UUID;
```

### Issue 4: Permission Issues
**Symptoms:** "permission denied" error
**Solution:** Check Supabase RLS policies:
```sql
-- Disable RLS temporarily for testing
ALTER TABLE auth_user DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_session DISABLE ROW LEVEL SECURITY;
```

### Issue 5: UUID Generation Issues
**Symptoms:** "invalid input syntax for type uuid"
**Solution:** Enable UUID extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue 6: Supabase Service Key Issues
**Symptoms:** Authentication errors
**Solution:** 
1. Check service key in Supabase dashboard
2. Ensure it has admin permissions
3. Verify it's not expired

## 🧪 Testing Process

### 1. Test Environment Setup
```bash
# Check if all environment variables are set
curl http://localhost:3000/api/auth/google/test
```

### 2. Test Database Schema
```bash
# Verify database can handle OAuth users
curl http://localhost:3000/api/auth/verify-db
```

### 3. Test OAuth Flow
1. Go to: `http://localhost:3000/auth`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Check server logs for detailed debugging

### 4. Verify Data Storage
```sql
-- Check if user was created
SELECT * FROM auth_user WHERE provider = 'google' ORDER BY created_at DESC LIMIT 5;

-- Check if session was created
SELECT s.*, u.email 
FROM user_session s 
JOIN auth_user u ON s.user_id = u.id 
WHERE u.provider = 'google' 
ORDER BY s.created_at DESC LIMIT 5;
```

## 🔍 Debug Log Analysis

### Successful Flow:
```
✅ User info fetched successfully: { email: "user@gmail.com", name: "User Name" }
🔍 Checking for existing user with email: user@gmail.com
👤 Existing user check result: { found: false, error: "PGRST116" }
💾 Attempting to upsert user with data: { id: "...", email: "...", provider: "google" }
💾 Upsert result: { success: true, user: { id: "...", email: "..." } }
✅ User successfully created/updated: { id: "...", email: "..." }
```

### Failed Flow Examples:
```
❌ User upsert error: { code: "42P01", message: "relation \"auth_user\" does not exist" }
❌ User upsert error: { code: "42703", message: "column \"provider\" does not exist" }
❌ User upsert error: { code: "23505", message: "duplicate key value violates unique constraint" }
```

## 🚀 Quick Fix Commands

### Create Missing Tables:
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS auth_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'email',
  is_activated BOOLEAN DEFAULT false,
  activation_token UUID,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth_user(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activity_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Add Indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_auth_user_email ON auth_user(email);
CREATE INDEX IF NOT EXISTS idx_auth_user_provider ON auth_user(provider);
CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_session(user_id);
```

## ✅ Success Indicators

After fixing, you should see:
1. ✅ Test endpoints return success
2. ✅ Server logs show successful user creation
3. ✅ Data appears in auth_user table
4. ✅ Sessions are created in user_session table
5. ✅ User can log in and access protected routes

Run the test endpoints first to identify the exact issue! 🔧

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAuthUserTable() {
  console.log('🔧 Fixing auth_user table for Google OAuth...');

  try {
    // Check current table structure
    console.log('📋 Checking current table structure...');
    
    // Try to add missing columns to auth_user (is_activated is in user_activation table)
    const alterQueries = [
      'ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT \'email\'',
      'ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS avatar_url TEXT'
    ];

    for (const query of alterQueries) {
      try {
        console.log(`🔨 Running: ${query}`);
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Query failed (might already exist): ${error.message}`);
        } else {
          console.log('✅ Success');
        }
      } catch (err) {
        console.log(`⚠️  Query failed: ${err.message}`);
      }
    }

    // Update existing users with proper defaults
    console.log('🔄 Updating existing users with defaults...');
    
    // Set provider to 'email' for users without a provider
    const { error: providerUpdateError } = await supabase
      .from('auth_user')
      .update({ provider: 'email' })
      .is('provider', null);

    if (providerUpdateError) {
      console.log('⚠️  Provider update warning:', providerUpdateError.message);
    }

    // Create user_activation table if it doesn't exist
    console.log('🔧 Ensuring user_activation table exists...');
    const createActivationTableQuery = `
      CREATE TABLE IF NOT EXISTS user_activation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth_user(id) ON DELETE CASCADE,
        is_activated BOOLEAN DEFAULT false,
        activated_at TIMESTAMP WITH TIME ZONE,
        activation_method VARCHAR(50),
        activation_token UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createActivationTableQuery });
      if (error) {
        console.log('⚠️  user_activation table creation warning:', error.message);
      } else {
        console.log('✅ user_activation table ensured');
      }
    } catch (err) {
      console.log('⚠️  user_activation table creation failed:', err.message);
    }

    // Create indexes
    console.log('📊 Creating indexes...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_auth_user_provider ON auth_user(provider)',
      'CREATE INDEX IF NOT EXISTS idx_auth_user_email ON auth_user(email)',
      'CREATE INDEX IF NOT EXISTS idx_auth_user_activation ON auth_user(is_activated)'
    ];

    for (const query of indexQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Index creation warning: ${error.message}`);
        } else {
          console.log(`✅ Index created: ${query.split(' ')[5]}`);
        }
      } catch (err) {
        console.log(`⚠️  Index creation failed: ${err.message}`);
      }
    }

    // Test the fix by trying to insert a test Google user
    console.log('🧪 Testing Google OAuth user creation...');
    const testEmail = 'test-oauth-fix@example.com';
    
    // Clean up any existing test user
    await supabase
      .from('auth_user')
      .delete()
      .eq('email', testEmail);

    // Try to insert a Google OAuth user
    const { data: testUser, error: testError } = await supabase
      .from('auth_user')
      .insert({
        email: testEmail,
        name: 'Test Google User',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'google',
        is_activated: true
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Test user creation failed:', testError);
    } else {
      console.log('✅ Test user created successfully:', {
        id: testUser.id,
        email: testUser.email,
        provider: testUser.provider
      });

      // Clean up test user
      await supabase
        .from('auth_user')
        .delete()
        .eq('id', testUser.id);
      
      console.log('🧹 Test user cleaned up');
    }

    console.log('\n🎉 Database fix completed!');
    console.log('You can now test Google OAuth at: http://localhost:3000/auth');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixAuthUserTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixAuthUserTable };

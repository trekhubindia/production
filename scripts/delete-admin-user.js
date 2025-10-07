const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteAdminUser() {
  const adminEmail = 'admin@trekhubindia.com';

  try {
    console.log('🗑️  Deleting existing admin user...');

    // Find the user first
    const { data: user, error: findError } = await supabase
      .from('auth_user')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (findError || !user) {
      console.log('ℹ️  No existing admin user found to delete');
      return;
    }

    const userId = user.id;
    console.log('Found user ID:', userId);

    // Delete from all related tables in correct order (foreign key dependencies)
    
    console.log('1️⃣ Deleting user sessions...');
    await supabase.from('user_session').delete().eq('user_id', userId);
    
    console.log('2️⃣ Deleting user activation...');
    await supabase.from('user_activation').delete().eq('user_id', userId);
    
    console.log('3️⃣ Deleting user roles...');
    await supabase.from('user_roles').delete().eq('user_id', userId);
    
    console.log('4️⃣ Deleting user profile...');
    await supabase.from('user_profiles').delete().eq('user_id', userId);
    
    console.log('5️⃣ Deleting user keys...');
    await supabase.from('user_key').delete().eq('user_id', userId);
    
    console.log('6️⃣ Deleting auth user...');
    await supabase.from('auth_user').delete().eq('id', userId);

    console.log('✅ Admin user deleted successfully!');
    console.log('You can now recreate the admin user with the correct password hash.');

  } catch (error) {
    console.error('❌ Error deleting admin user:', error);
  }
}

// Run the script
deleteAdminUser();

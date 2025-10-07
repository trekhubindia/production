const { createClient } = require('@supabase/supabase-js');
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  const adminEmail = 'admin@trekhubindia.com';
  const adminPassword = 'Admin@123';
  const adminId = uuidv4();
  const keyId = uuidv4();

  try {
    console.log('🔧 Creating admin user with Lucia Auth structure...');

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('auth_user')
      .select('id, email')
      .eq('email', adminEmail)
      .single();

    if (existingUser) {
      console.log('⚠️  Admin user already exists:', existingUser.email);
      console.log('User ID:', existingUser.id);
      return;
    }

    // Hash the password using Argon2 (same as Lucia Auth)
    const hashedPassword = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    console.log('1️⃣ Creating user in auth_user table...');
    // Create user in auth_user table (basic structure based on schema)
    const { data: newUser, error: userError } = await supabase
      .from('auth_user')
      .insert({
        id: adminId,
        email: adminEmail,
        provider: 'password',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ Admin user created in auth_user table');

    console.log('2️⃣ Creating password key in user_key table...');
    // Create password key in user_key table (Lucia Auth pattern)
    const { data: userKey, error: keyError } = await supabase
      .from('user_key')
      .insert({
        id: `email:${adminEmail}`,
        user_id: adminId,
        hashed_password: hashedPassword,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (keyError) {
      console.error('❌ Error creating user key:', keyError);
      // Try to clean up the user if key creation failed
      await supabase.from('auth_user').delete().eq('id', adminId);
      return;
    }

    console.log('✅ Password key created in user_key table');

    console.log('3️⃣ Activating user account...');
    // Mark user as activated in user_activation table
    const { error: activationError } = await supabase
      .from('user_activation')
      .insert({
        user_id: adminId,
        activation_token: '',
        is_activated: true,
        activated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (activationError) {
      console.warn('⚠️  Warning: Could not create activation record:', activationError.message);
    } else {
      console.log('✅ User activation record created');
    }

    console.log('4️⃣ Setting admin role...');
    // Set admin role in user_roles table
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: adminId,
        role: 'admin',
        assigned_by: adminId, // Self-assigned
        assigned_at: new Date().toISOString(),
        expires_at: null, // No expiration
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (roleError) {
      console.warn('⚠️  Warning: Could not create role record:', roleError.message);
    } else {
      console.log('✅ Admin role assigned');
    }

    console.log('5️⃣ Creating user profile...');
    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: adminId,
        username: 'admin_user',
        name: 'Admin User',
        phone: '+91-9876543210',
        gender: 'other',
        location: 'India',
        bio: 'System Administrator for Trek Hub India',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.warn('⚠️  Warning: Could not create user profile:', profileError.message);
    } else {
      console.log('✅ Admin user profile created successfully!');
    }

    console.log('\n🎉 Admin account setup complete!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🔐 User ID:', adminId);
    console.log('🔑 Key ID:', keyId);
    console.log('👤 Role: admin');
    console.log('✅ Status: Activated');
    console.log('\nYou can now login with these credentials at /auth/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Run the script
createAdminUser();

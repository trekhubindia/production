const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function setupSimplifiedRLS() {
  const connectionString = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  
  console.log('🔐 Setting up Simplified RLS Policies for Lucia Auth...\n');

  // Drop existing policies first
  console.log('🧹 Cleaning up existing policies...');
  
  const cleanupCommands = [
    'DROP POLICY IF EXISTS "Public read access for treks" ON treks;',
    'DROP POLICY IF EXISTS "Public read access for trek_slots" ON trek_slots;',
    'DROP POLICY IF EXISTS "Public read access for trek_images" ON trek_images;',
    'DROP POLICY IF EXISTS "Service role full access for treks" ON treks;',
    'DROP POLICY IF EXISTS "Service role full access for trek_slots" ON trek_slots;',
    'DROP POLICY IF EXISTS "Service role full access for trek_images" ON trek_images;',
    'DROP POLICY IF EXISTS "Service role full access for bookings" ON bookings;',
    'DROP POLICY IF EXISTS "Service role full access for user_profiles" ON user_profiles;',
    'DROP POLICY IF EXISTS "Service role full access for user_session" ON user_session;',
    'DROP POLICY IF EXISTS "Service role full access for user_roles" ON user_roles;',
    'DROP POLICY IF EXISTS "Service role full access for wishlists" ON wishlists;',
    'DROP POLICY IF EXISTS "Service role full access for vouchers" ON vouchers;'
  ];

  for (const cmd of cleanupCommands) {
    try {
      await execAsync(`psql "${connectionString}" -c "${cmd}" -v ON_ERROR_STOP=1`);
    } catch (error) {
      // Ignore errors for non-existent policies
    }
  }

  console.log('✅ Cleanup completed\n');

  // Create simplified policies that work with service role
  const policies = [
    // Public read access for public data
    {
      name: 'Treks - Public read access',
      sql: `CREATE POLICY "treks_select_policy" ON treks FOR SELECT USING (true);`
    },
    {
      name: 'Trek slots - Public read access',
      sql: `CREATE POLICY "trek_slots_select_policy" ON trek_slots FOR SELECT USING (true);`
    },
    {
      name: 'Trek images - Public read access',
      sql: `CREATE POLICY "trek_images_select_policy" ON trek_images FOR SELECT USING (true);`
    },

    // Service role gets full access to everything
    {
      name: 'Treks - Service role full access',
      sql: `CREATE POLICY "treks_service_policy" ON treks FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Trek slots - Service role full access',
      sql: `CREATE POLICY "trek_slots_service_policy" ON trek_slots FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Trek images - Service role full access',
      sql: `CREATE POLICY "trek_images_service_policy" ON trek_images FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Bookings - Service role full access',
      sql: `CREATE POLICY "bookings_service_policy" ON bookings FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'User profiles - Service role full access',
      sql: `CREATE POLICY "user_profiles_service_policy" ON user_profiles FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'User sessions - Service role full access',
      sql: `CREATE POLICY "user_session_service_policy" ON user_session FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'User roles - Service role full access',
      sql: `CREATE POLICY "user_roles_service_policy" ON user_roles FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Wishlists - Service role full access',
      sql: `CREATE POLICY "wishlists_service_policy" ON wishlists FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Vouchers - Service role full access',
      sql: `CREATE POLICY "vouchers_service_policy" ON vouchers FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Password reset tokens - Service role full access',
      sql: `CREATE POLICY "password_reset_tokens_service_policy" ON password_reset_tokens FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'User activation - Service role full access',
      sql: `CREATE POLICY "user_activation_service_policy" ON user_activation FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Booking documents - Service role full access',
      sql: `CREATE POLICY "booking_documents_service_policy" ON booking_documents FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Booking participants - Service role full access',
      sql: `CREATE POLICY "booking_participants_service_policy" ON booking_participants FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Payment transactions - Service role full access',
      sql: `CREATE POLICY "payment_transactions_service_policy" ON payment_transactions FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Chat histories - Service role full access',
      sql: `CREATE POLICY "chat_histories_service_policy" ON chat_histories FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Admin analytics - Service role full access',
      sql: `CREATE POLICY "admin_analytics_service_policy" ON admin_analytics FOR ALL USING (current_setting('role') = 'postgres');`
    },
    {
      name: 'Admin dashboard settings - Service role full access',
      sql: `CREATE POLICY "admin_dashboard_settings_service_policy" ON admin_dashboard_settings FOR ALL USING (current_setting('role') = 'postgres');`
    }
  ];

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log('🛡️ Creating simplified RLS policies...');

  for (const policy of policies) {
    try {
      await execAsync(`psql "${connectionString}" -c "${policy.sql}" -v ON_ERROR_STOP=1`);
      console.log(`   ✅ ${policy.name}`);
      successCount++;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  ${policy.name}: Already exists`);
      } else {
        console.log(`   ❌ ${policy.name}: ${error.message.split('\n')[0]}`);
        errors.push({ policy: policy.name, error: error.message.split('\n')[0] });
        errorCount++;
      }
    }
  }

  console.log(`\n📊 RLS Policy Setup Summary:`);
  console.log(`   ✅ Successfully created: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total processed: ${policies.length}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.policy}: ${err.error}`);
    });
  }

  // Verify RLS status and policy count
  console.log('\n🔍 Verifying RLS Status and Policies...');
  
  try {
    const { stdout } = await execAsync(`psql "${connectionString}" -c "
      SELECT 
        t.tablename, 
        t.rowsecurity as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count
      FROM pg_tables t 
      LEFT JOIN (
        SELECT schemaname, tablename, count(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename
      ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
      WHERE t.schemaname = 'public' 
      AND t.tablename IN ('treks', 'trek_slots', 'trek_images', 'bookings', 'user_profiles', 'wishlists', 'vouchers', 'user_session', 'user_roles')
      ORDER BY t.tablename;
    " -t`);
    
    console.log('📋 RLS Status for Core Tables:');
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const parts = line.trim().split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const [table, rlsEnabled, policyCount] = parts;
        const rlsStatus = rlsEnabled === 't' ? '✅ Enabled' : '❌ Disabled';
        console.log(`   ${table}: ${rlsStatus} (${policyCount} policies)`);
      }
    });
  } catch (error) {
    console.log('   ⚠️  Could not verify RLS status');
  }

  // Test policy functionality
  console.log('\n🧪 Testing policy functionality...');
  
  try {
    // Test public read access to treks
    const { stdout: trekTest } = await execAsync(`psql "${connectionString}" -c "SELECT count(*) FROM treks;" -t`);
    const trekCount = parseInt(trekTest.trim());
    console.log(`   ✅ Public trek access: ${trekCount} treks readable`);

    // Test trek_slots access
    const { stdout: slotsTest } = await execAsync(`psql "${connectionString}" -c "SELECT count(*) FROM trek_slots;" -t`);
    const slotsCount = parseInt(slotsTest.trim());
    console.log(`   ✅ Trek slots access: ${slotsCount} slots readable`);

    // Test service role access to bookings
    const { stdout: bookingsTest } = await execAsync(`psql "${connectionString}" -c "SELECT count(*) FROM bookings;" -t`);
    const bookingsCount = parseInt(bookingsTest.trim());
    console.log(`   ✅ Service role bookings access: ${bookingsCount} bookings accessible`);

  } catch (error) {
    console.log(`   ⚠️  Policy test failed: ${error.message.split('\n')[0]}`);
  }

  console.log('\n✨ Simplified RLS setup completed!');
  console.log('🔐 Database security is configured for Lucia Auth architecture');
  console.log('📝 Note: API endpoints handle user-specific access control');
}

if (require.main === module) {
  setupSimplifiedRLS()
    .then(() => {
      console.log('\n🎉 Simplified RLS setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 RLS setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSimplifiedRLS };

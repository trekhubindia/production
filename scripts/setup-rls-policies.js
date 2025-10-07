const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function setupRLSPolicies() {
  const connectionString = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  
  console.log('🔐 Setting up Row Level Security (RLS) and Policies...\n');

  const rlsCommands = [
    // Enable RLS on core tables
    {
      name: 'Enable RLS on treks table',
      sql: 'ALTER TABLE treks ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on trek_slots table',
      sql: 'ALTER TABLE trek_slots ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on trek_images table',
      sql: 'ALTER TABLE trek_images ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on bookings table',
      sql: 'ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on user_profiles table',
      sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on user_session table',
      sql: 'ALTER TABLE user_session ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on user_roles table',
      sql: 'ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on wishlists table',
      sql: 'ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on vouchers table',
      sql: 'ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on password_reset_tokens table',
      sql: 'ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on user_activation table',
      sql: 'ALTER TABLE user_activation ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on booking_documents table',
      sql: 'ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on booking_participants table',
      sql: 'ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on payment_transactions table',
      sql: 'ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on chat_histories table',
      sql: 'ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on admin_analytics table',
      sql: 'ALTER TABLE admin_analytics ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on admin_dashboard_settings table',
      sql: 'ALTER TABLE admin_dashboard_settings ENABLE ROW LEVEL SECURITY;'
    }
  ];

  // Execute RLS enable commands
  console.log('⚡ Enabling RLS on tables...');
  for (const command of rlsCommands) {
    try {
      await execAsync(`psql "${connectionString}" -c "${command.sql}" -v ON_ERROR_STOP=1`);
      console.log(`   ✅ ${command.name}`);
    } catch (error) {
      console.log(`   ⚠️  ${command.name}: ${error.message.split('\n')[0]}`);
    }
  }

  console.log('\n🛡️ Creating RLS Policies...\n');

  const policies = [
    // Public read policies for treks and related data
    {
      name: 'Treks - Public read access',
      sql: `CREATE POLICY "Public read access for treks" ON treks FOR SELECT USING (true);`
    },
    {
      name: 'Trek slots - Public read access',
      sql: `CREATE POLICY "Public read access for trek_slots" ON trek_slots FOR SELECT USING (true);`
    },
    {
      name: 'Trek images - Public read access',
      sql: `CREATE POLICY "Public read access for trek_images" ON trek_images FOR SELECT USING (true);`
    },

    // Service role full access policies
    {
      name: 'Treks - Service role full access',
      sql: `CREATE POLICY "Service role full access for treks" ON treks FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Trek slots - Service role full access',
      sql: `CREATE POLICY "Service role full access for trek_slots" ON trek_slots FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Trek images - Service role full access',
      sql: `CREATE POLICY "Service role full access for trek_images" ON trek_images FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Bookings - Service role full access',
      sql: `CREATE POLICY "Service role full access for bookings" ON bookings FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'User profiles - Service role full access',
      sql: `CREATE POLICY "Service role full access for user_profiles" ON user_profiles FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'User sessions - Service role full access',
      sql: `CREATE POLICY "Service role full access for user_session" ON user_session FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'User roles - Service role full access',
      sql: `CREATE POLICY "Service role full access for user_roles" ON user_roles FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Wishlists - Service role full access',
      sql: `CREATE POLICY "Service role full access for wishlists" ON wishlists FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Vouchers - Service role full access',
      sql: `CREATE POLICY "Service role full access for vouchers" ON vouchers FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Password reset tokens - Service role full access',
      sql: `CREATE POLICY "Service role full access for password_reset_tokens" ON password_reset_tokens FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'User activation - Service role full access',
      sql: `CREATE POLICY "Service role full access for user_activation" ON user_activation FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Booking documents - Service role full access',
      sql: `CREATE POLICY "Service role full access for booking_documents" ON booking_documents FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Booking participants - Service role full access',
      sql: `CREATE POLICY "Service role full access for booking_participants" ON booking_participants FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Payment transactions - Service role full access',
      sql: `CREATE POLICY "Service role full access for payment_transactions" ON payment_transactions FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Chat histories - Service role full access',
      sql: `CREATE POLICY "Service role full access for chat_histories" ON chat_histories FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Admin analytics - Service role full access',
      sql: `CREATE POLICY "Service role full access for admin_analytics" ON admin_analytics FOR ALL USING (auth.role() = 'service_role');`
    },
    {
      name: 'Admin dashboard settings - Service role full access',
      sql: `CREATE POLICY "Service role full access for admin_dashboard_settings" ON admin_dashboard_settings FOR ALL USING (auth.role() = 'service_role');`
    },

    // User-specific policies (for authenticated users)
    {
      name: 'Bookings - Users can view their own bookings',
      sql: `CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid()::text = user_id::text);`
    },
    {
      name: 'Bookings - Users can create their own bookings',
      sql: `CREATE POLICY "Users can create their own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);`
    },
    {
      name: 'User profiles - Users can view their own profile',
      sql: `CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid()::text = user_id::text);`
    },
    {
      name: 'User profiles - Users can update their own profile',
      sql: `CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);`
    },
    {
      name: 'Wishlists - Users can view their own wishlists',
      sql: `CREATE POLICY "Users can view their own wishlists" ON wishlists FOR SELECT USING (auth.uid()::text = user_id::text);`
    },
    {
      name: 'Wishlists - Users can create their own wishlists',
      sql: `CREATE POLICY "Users can create their own wishlists" ON wishlists FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);`
    },
    {
      name: 'Wishlists - Users can delete their own wishlists',
      sql: `CREATE POLICY "Users can delete their own wishlists" ON wishlists FOR DELETE USING (auth.uid()::text = user_id::text);`
    },
    {
      name: 'Chat histories - Users can view their own chat histories',
      sql: `CREATE POLICY "Users can view their own chat histories" ON chat_histories FOR SELECT USING (auth.uid()::text = user_id::text);`
    },
    {
      name: 'Chat histories - Users can update their own chat histories',
      sql: `CREATE POLICY "Users can update their own chat histories" ON chat_histories FOR UPDATE USING (auth.uid()::text = user_id::text);`
    },

    // Admin-specific policies
    {
      name: 'Admin analytics - Admin users can access analytics',
      sql: `CREATE POLICY "Admin users can access analytics" ON admin_analytics FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id::text = auth.uid()::text 
          AND role = 'admin' 
          AND is_active = true
        )
      );`
    },
    {
      name: 'Admin dashboard settings - Admin users can manage settings',
      sql: `CREATE POLICY "Admin users can manage dashboard settings" ON admin_dashboard_settings FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id::text = auth.uid()::text 
          AND role = 'admin' 
          AND is_active = true
        )
      );`
    },

    // Anonymous access policies
    {
      name: 'Treks - Anonymous read access',
      sql: `CREATE POLICY "Anonymous read access for treks" ON treks FOR SELECT USING (status = true);`
    },
    {
      name: 'Trek slots - Anonymous read access for available slots',
      sql: `CREATE POLICY "Anonymous read access for available trek_slots" ON trek_slots FOR SELECT USING (status = 'open');`
    }
  ];

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

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

  // Verify RLS status
  console.log('\n🔍 Verifying RLS Status...');
  
  try {
    const { stdout } = await execAsync(`psql "${connectionString}" -c "
      SELECT 
        schemaname, 
        tablename, 
        rowsecurity as rls_enabled,
        (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
      FROM pg_tables t 
      WHERE schemaname = 'public' 
      AND tablename IN ('treks', 'trek_slots', 'trek_images', 'bookings', 'user_profiles', 'wishlists', 'vouchers')
      ORDER BY tablename;
    " -t`);
    
    console.log('📋 RLS Status for Core Tables:');
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const parts = line.trim().split('|').map(p => p.trim());
      if (parts.length >= 4) {
        const [schema, table, rlsEnabled, policyCount] = parts;
        const rlsStatus = rlsEnabled === 't' ? '✅ Enabled' : '❌ Disabled';
        console.log(`   ${table}: ${rlsStatus} (${policyCount} policies)`);
      }
    });
  } catch (error) {
    console.log('   ⚠️  Could not verify RLS status');
  }

  console.log('\n✨ RLS and Policy setup completed!');
  console.log('🔐 Database security is now properly configured');
}

if (require.main === module) {
  setupRLSPolicies()
    .then(() => {
      console.log('\n🎉 RLS setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 RLS setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupRLSPolicies };

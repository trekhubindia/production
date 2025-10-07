const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema and tables...\n');

    // Database connection details
    const dbHost = '127.0.0.1';
    const dbPort = '54322';
    const dbName = 'postgres';
    const dbPassword = 'postgres';
    
    const connectionString = `postgresql://postgres:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    
    console.log(`📊 Database connection: ${dbHost}:${dbPort}/${dbName}\n`);

    // Test connection
    try {
      const { stdout: versionOutput } = await execAsync(`psql "${connectionString}" -c "SELECT version();" -t`);
      console.log('✅ Database connection successful');
      console.log(`📊 PostgreSQL: ${versionOutput.trim()}\n`);
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('\n💡 Make sure Supabase is running: supabase start');
      return;
    }

    // List all tables
    console.log('📋 Checking existing tables...');
    try {
      const { stdout: tablesOutput } = await execAsync(
        `psql "${connectionString}" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" -t`
      );
      
      const tables = tablesOutput.trim().split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split('|').map(p => p.trim());
          return parts[1] || line;
        });
      
      if (tables.length === 0) {
        console.log('❌ No tables found in public schema');
        console.log('💡 You may need to run migrations first');
        
        // Check if we can see any schemas
        const { stdout: schemasOutput } = await execAsync(
          `psql "${connectionString}" -c "SELECT schema_name FROM information_schema.schemata;" -t`
        );
        console.log('\n📊 Available schemas:');
        console.log(schemasOutput);
        
        return;
      }
      
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
      });
      
      // Check existing indexes
      console.log('\n🔍 Checking existing indexes...');
      const { stdout: indexesOutput } = await execAsync(
        `psql "${connectionString}" -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;" -t`
      );
      
      const indexes = indexesOutput.trim().split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      console.log(`📊 Found ${indexes.length} existing indexes:`);
      
      // Group indexes by table
      const indexesByTable = {};
      indexes.forEach(indexLine => {
        const parts = indexLine.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          const tableName = parts[1];
          const indexName = parts[2];
          
          if (!indexesByTable[tableName]) {
            indexesByTable[tableName] = [];
          }
          indexesByTable[tableName].push(indexName);
        }
      });
      
      Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
        console.log(`   📊 ${table}: ${tableIndexes.length} indexes`);
        tableIndexes.forEach(index => {
          console.log(`      - ${index}`);
        });
      });
      
      // Now create indexes only for existing tables
      console.log('\n⚡ Creating indexes for existing tables...');
      await createIndexesForExistingTables(connectionString, tables);
      
    } catch (error) {
      console.log('❌ Error checking tables:', error.message);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

async function createIndexesForExistingTables(connectionString, existingTables) {
  const indexDefinitions = {
    'treks': [
      'CREATE INDEX IF NOT EXISTS idx_treks_status_featured ON treks (status, featured) WHERE status = true;',
      'CREATE INDEX IF NOT EXISTS idx_treks_region_difficulty ON treks (region, difficulty);',
      'CREATE INDEX IF NOT EXISTS idx_treks_status_region ON treks (status, region) WHERE status = true;',
      'CREATE INDEX IF NOT EXISTS idx_treks_price_range ON treks (price) WHERE price IS NOT NULL AND status = true;',
      'CREATE INDEX IF NOT EXISTS idx_treks_name_gin ON treks USING gin (to_tsvector(\'english\', name));',
      'CREATE INDEX IF NOT EXISTS idx_treks_updated_at ON treks (updated_at);',
      'CREATE INDEX IF NOT EXISTS idx_treks_rating ON treks (rating) WHERE rating IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_treks_active_only ON treks (name, region, difficulty) WHERE status = true;',
      'CREATE INDEX IF NOT EXISTS idx_treks_admin_dashboard ON treks (status, featured, created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_treks_search_filter ON treks (region, difficulty, price, status) WHERE status = true;'
    ],
    'trek_slots': [
      'CREATE INDEX IF NOT EXISTS idx_trek_slots_availability ON trek_slots (trek_slug, date, status) WHERE status IN (\'open\', \'full\');',
      'CREATE INDEX IF NOT EXISTS idx_trek_slots_future_dates ON trek_slots (date, status) WHERE date >= CURRENT_DATE AND status = \'open\';',
      'CREATE INDEX IF NOT EXISTS idx_trek_slots_capacity_check ON trek_slots (trek_slug, capacity, booked) WHERE status = \'open\';',
      'CREATE INDEX IF NOT EXISTS idx_slots_available_only ON trek_slots (trek_slug, date) WHERE status = \'open\' AND date >= CURRENT_DATE;'
    ],
    'bookings': [
      'CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings (user_id, status);',
      'CREATE INDEX IF NOT EXISTS idx_bookings_trek_date_status ON bookings (trek_slug, booking_date, status);',
      'CREATE INDEX IF NOT EXISTS idx_bookings_payment_created ON bookings (payment_status, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON bookings (confirmation_code) WHERE confirmation_code IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_only ON bookings (trek_slug, booking_date) WHERE status = \'confirmed\';',
      'CREATE INDEX IF NOT EXISTS idx_bookings_dashboard ON bookings (created_at DESC, status, payment_status) WHERE created_at >= NOW() - INTERVAL \'90 days\';'
    ],
    'user_profiles': [
      'CREATE INDEX IF NOT EXISTS idx_user_profiles_name_search ON user_profiles USING gin (to_tsvector(\'english\', name));',
      'CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles (phone) WHERE phone IS NOT NULL;'
    ],
    'user_session': [
      'CREATE INDEX IF NOT EXISTS idx_user_session_active ON user_session (user_id, expires_at) WHERE expires_at > NOW();',
      'CREATE INDEX IF NOT EXISTS idx_user_session_cleanup ON user_session (expires_at) WHERE expires_at < NOW();',
      'CREATE INDEX IF NOT EXISTS idx_user_session_expired ON user_session (expires_at) WHERE expires_at < NOW();'
    ],
    'user_roles': [
      'CREATE INDEX IF NOT EXISTS idx_user_roles_active_role ON user_roles (user_id, role) WHERE is_active = true;'
    ],
    'wishlists': [
      'CREATE INDEX IF NOT EXISTS idx_wishlists_user_trek ON wishlists (user_id, trek_id);',
      'CREATE INDEX IF NOT EXISTS idx_wishlists_trek_count ON wishlists (trek_id);',
      'CREATE INDEX IF NOT EXISTS idx_wishlists_user_created ON wishlists (user_id, created_at DESC);'
    ],
    'vouchers': [
      'CREATE INDEX IF NOT EXISTS idx_vouchers_code_active ON vouchers (code) WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW());',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_user_active ON vouchers (user_id, is_active) WHERE is_active = true;'
    ],
    'password_reset_tokens': [
      'CREATE INDEX IF NOT EXISTS idx_password_reset_cleanup ON password_reset_tokens (expires_at) WHERE expires_at < NOW();',
      'CREATE INDEX IF NOT EXISTS idx_password_reset_active ON password_reset_tokens (user_id, expires_at) WHERE is_used = false AND expires_at > NOW();'
    ],
    'user_activation': [
      'CREATE INDEX IF NOT EXISTS idx_user_activation_pending ON user_activation (user_id, expires_at) WHERE is_activated = false AND expires_at > NOW();'
    ]
  };

  let totalIndexes = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const table of existingTables) {
    if (indexDefinitions[table]) {
      console.log(`\n📊 Creating indexes for table: ${table}`);
      
      for (const indexSQL of indexDefinitions[table]) {
        totalIndexes++;
        
        // Extract index name for logging
        const indexMatch = indexSQL.match(/CREATE INDEX.*?(\w+)\s+ON/i);
        const indexName = indexMatch ? indexMatch[1] : `index_${totalIndexes}`;
        
        try {
          console.log(`   ⚡ Creating: ${indexName}`);
          
          const { stdout, stderr } = await execAsync(
            `psql "${connectionString}" -c "${indexSQL.replace(/"/g, '\\"')}" -v ON_ERROR_STOP=1`
          );
          
          if (stderr && stderr.includes('already exists')) {
            console.log(`      ⚠️  Already exists`);
          } else if (stderr && !stderr.includes('NOTICE')) {
            console.log(`      ⚠️  Warning: ${stderr.trim()}`);
          } else {
            console.log(`      ✅ Created successfully`);
            successCount++;
          }
          
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`      ⚠️  Already exists`);
          } else {
            console.log(`      ❌ Failed: ${error.message.split('\n')[0]}`);
            errorCount++;
          }
        }
      }
    } else {
      console.log(`⚠️  No indexes defined for table: ${table}`);
    }
  }

  console.log(`\n📊 Index Creation Summary:`);
  console.log(`   ✅ Successfully created: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   ⚠️  Already existing: ${totalIndexes - successCount - errorCount}`);
  console.log(`   📊 Total processed: ${totalIndexes}`);

  // Analyze tables for better performance
  console.log('\n📈 Analyzing tables for better query planning...');
  for (const table of existingTables) {
    try {
      await execAsync(`psql "${connectionString}" -c "ANALYZE ${table};" -v ON_ERROR_STOP=1`);
      console.log(`   ✅ Analyzed: ${table}`);
    } catch (error) {
      console.log(`   ⚠️  Could not analyze: ${table}`);
    }
  }
}

// Run the schema check
if (require.main === module) {
  checkDatabaseSchema()
    .then(() => {
      console.log('\n✨ Database schema check and indexing completed!');
      console.log('🔍 Run performance test: node scripts/simple-performance-check.js');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Schema check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseSchema };

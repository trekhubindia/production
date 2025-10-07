const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to check table sizes
async function checkTableSizes() {
  try {
    console.log('📊 Analyzing table sizes...\n');
    
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        `
      });

    if (error) {
      console.log('⚠️  Could not fetch table sizes via RPC');
      return;
    }

    if (data && data.length > 0) {
      console.log('📈 Table Sizes:');
      data.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.tablename}: ${table.size}`);
      });
    }
  } catch (error) {
    console.log('⚠️  Table size analysis not available:', error.message);
  }
}

// Function to check index usage
async function checkIndexUsage() {
  try {
    console.log('\n🔍 Analyzing index usage...\n');
    
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
          FROM pg_stat_user_indexes 
          WHERE schemaname = 'public'
          ORDER BY idx_scan DESC
          LIMIT 20;
        `
      });

    if (error) {
      console.log('⚠️  Could not fetch index usage via RPC');
      return;
    }

    if (data && data.length > 0) {
      console.log('📊 Most Used Indexes:');
      data.forEach((index, i) => {
        console.log(`   ${i + 1}. ${index.indexname} (${index.tablename}): ${index.idx_scan} scans`);
      });
    }
  } catch (error) {
    console.log('⚠️  Index usage analysis not available:', error.message);
  }
}

// Function to check slow queries
async function checkSlowQueries() {
  try {
    console.log('\n⏱️  Checking for slow queries...\n');
    
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements 
          WHERE query NOT LIKE '%pg_stat_statements%'
          ORDER BY mean_time DESC
          LIMIT 10;
        `
      });

    if (error) {
      console.log('⚠️  pg_stat_statements extension may not be enabled');
      return;
    }

    if (data && data.length > 0) {
      console.log('🐌 Slowest Queries:');
      data.forEach((query, index) => {
        console.log(`   ${index + 1}. Mean time: ${parseFloat(query.mean_time).toFixed(2)}ms`);
        console.log(`      Query: ${query.query.substring(0, 100)}...`);
      });
    }
  } catch (error) {
    console.log('⚠️  Slow query analysis not available:', error.message);
  }
}

// Function to check database connections
async function checkConnections() {
  try {
    console.log('\n🔗 Checking database connections...\n');
    
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            state,
            COUNT(*) as connection_count
          FROM pg_stat_activity 
          WHERE datname = current_database()
          GROUP BY state
          ORDER BY connection_count DESC;
        `
      });

    if (error) {
      console.log('⚠️  Could not fetch connection info via RPC');
      return;
    }

    if (data && data.length > 0) {
      console.log('🔌 Database Connections:');
      data.forEach((conn) => {
        console.log(`   ${conn.state || 'unknown'}: ${conn.connection_count} connections`);
      });
    }
  } catch (error) {
    console.log('⚠️  Connection analysis not available:', error.message);
  }
}

// Function to test query performance
async function testQueryPerformance() {
  console.log('\n⚡ Testing query performance...\n');
  
  const queries = [
    {
      name: 'Trek Search (Active)',
      query: 'SELECT id, name, slug, region, difficulty, price FROM treks WHERE status = true LIMIT 10'
    },
    {
      name: 'Featured Treks',
      query: 'SELECT id, name, slug, region, price FROM treks WHERE status = true AND featured = true LIMIT 5'
    },
    {
      name: 'Available Slots',
      query: 'SELECT trek_slug, date, capacity, booked FROM trek_slots WHERE status = \'open\' AND date >= CURRENT_DATE LIMIT 10'
    },
    {
      name: 'Recent Bookings',
      query: 'SELECT id, trek_slug, status, created_at FROM bookings WHERE created_at >= NOW() - INTERVAL \'30 days\' LIMIT 10'
    },
    {
      name: 'User Profiles',
      query: 'SELECT user_id, username, name FROM user_profiles LIMIT 10'
    }
  ];

  for (const testQuery of queries) {
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .rpc('exec_sql', { sql_query: testQuery.query });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.log(`   ❌ ${testQuery.name}: Error - ${error.message}`);
      } else {
        const resultCount = data ? data.length : 0;
        console.log(`   ✅ ${testQuery.name}: ${duration}ms (${resultCount} rows)`);
      }
    } catch (error) {
      console.log(`   ❌ ${testQuery.name}: ${error.message}`);
    }
  }
}

// Function to check missing indexes
async function suggestMissingIndexes() {
  console.log('\n💡 Analyzing potential missing indexes...\n');
  
  const suggestions = [
    {
      table: 'treks',
      suggestion: 'Consider composite index on (status, region, difficulty) for filtered searches',
      check: 'SELECT COUNT(*) FROM treks WHERE status = true AND region = \'Nepal\' AND difficulty = \'Moderate\''
    },
    {
      table: 'bookings',
      suggestion: 'Consider index on (user_id, created_at) for user booking history',
      check: 'SELECT COUNT(*) FROM bookings WHERE user_id IS NOT NULL'
    },
    {
      table: 'trek_slots',
      suggestion: 'Consider index on (date, status) for availability queries',
      check: 'SELECT COUNT(*) FROM trek_slots WHERE date >= CURRENT_DATE AND status = \'open\''
    }
  ];

  for (const suggestion of suggestions) {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: suggestion.check });
      const duration = Date.now() - startTime;
      
      if (!error) {
        console.log(`   📊 ${suggestion.table}: Query took ${duration}ms`);
        console.log(`      💡 ${suggestion.suggestion}`);
        if (duration > 100) {
          console.log(`      ⚠️  Consider adding index (query took ${duration}ms)`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Could not test ${suggestion.table}: ${error.message}`);
    }
  }
}

// Main monitoring function
async function monitorDatabasePerformance() {
  try {
    console.log('🔍 Database Performance Monitoring Report');
    console.log('==========================================\n');
    
    await checkTableSizes();
    await checkIndexUsage();
    await checkConnections();
    await testQueryPerformance();
    await suggestMissingIndexes();
    await checkSlowQueries();
    
    console.log('\n📋 Performance Recommendations:');
    console.log('================================');
    console.log('1. 📊 Monitor table growth and consider partitioning for large tables');
    console.log('2. 🔍 Regularly analyze unused indexes and drop them if not needed');
    console.log('3. ⚡ Add composite indexes for frequently used query combinations');
    console.log('4. 🧹 Set up automated VACUUM and ANALYZE schedules');
    console.log('5. 📈 Monitor connection pooling and query performance');
    console.log('6. 🗂️  Consider archiving old data (bookings, logs, sessions)');
    
    console.log('\n💡 Next Steps:');
    console.log('==============');
    console.log('1. Run the optimize-indexes.sql script in Supabase dashboard');
    console.log('2. Enable pg_stat_statements extension for query monitoring');
    console.log('3. Set up regular performance monitoring (weekly/monthly)');
    console.log('4. Monitor slow query logs and optimize problematic queries');
    
  } catch (error) {
    console.error('❌ Error during performance monitoring:', error);
  }
}

// Alternative simple performance check
async function simplePerformanceCheck() {
  console.log('🔍 Simple Performance Check');
  console.log('===========================\n');
  
  const tests = [
    { name: 'Trek Count', query: 'SELECT COUNT(*) as count FROM treks' },
    { name: 'Active Treks', query: 'SELECT COUNT(*) as count FROM treks WHERE status = true' },
    { name: 'Total Bookings', query: 'SELECT COUNT(*) as count FROM bookings' },
    { name: 'Available Slots', query: 'SELECT COUNT(*) as count FROM trek_slots WHERE status = \'open\' AND date >= CURRENT_DATE' },
    { name: 'User Profiles', query: 'SELECT COUNT(*) as count FROM user_profiles' }
  ];
  
  for (const test of tests) {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: test.query });
      const duration = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ ${test.name}: Error`);
      } else {
        const count = data && data[0] ? data[0].count : 0;
        console.log(`✅ ${test.name}: ${count} records (${duration}ms)`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n📊 Database appears to be functioning normally.');
  console.log('💡 For detailed analysis, run the full monitoring script.');
}

// Run monitoring
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--simple')) {
    simplePerformanceCheck()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    monitorDatabasePerformance()
      .then(() => {
        console.log('\n✨ Performance monitoring completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Performance monitoring failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { 
  monitorDatabasePerformance, 
  simplePerformanceCheck,
  checkTableSizes,
  checkIndexUsage,
  testQueryPerformance
};

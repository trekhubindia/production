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

async function checkDatabasePerformance() {
  console.log('🔍 Database Performance Check');
  console.log('=============================\n');

  const tests = [
    {
      name: 'Trek Count',
      table: 'treks',
      test: async () => {
        const { count, error } = await supabase
          .from('treks')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    },
    {
      name: 'Active Treks',
      table: 'treks',
      test: async () => {
        const { count, error } = await supabase
          .from('treks')
          .select('*', { count: 'exact', head: true })
          .eq('status', true);
        return { count, error };
      }
    },
    {
      name: 'Featured Treks',
      table: 'treks',
      test: async () => {
        const { count, error } = await supabase
          .from('treks')
          .select('*', { count: 'exact', head: true })
          .eq('status', true)
          .eq('featured', true);
        return { count, error };
      }
    },
    {
      name: 'Trek Slots',
      table: 'trek_slots',
      test: async () => {
        const { count, error } = await supabase
          .from('trek_slots')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    },
    {
      name: 'Available Slots',
      table: 'trek_slots',
      test: async () => {
        const { count, error } = await supabase
          .from('trek_slots')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open')
          .gte('date', new Date().toISOString().split('T')[0]);
        return { count, error };
      }
    },
    {
      name: 'Total Bookings',
      table: 'bookings',
      test: async () => {
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    },
    {
      name: 'User Profiles',
      table: 'user_profiles',
      test: async () => {
        const { count, error } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    },
    {
      name: 'Wishlists',
      table: 'wishlists',
      test: async () => {
        const { count, error } = await supabase
          .from('wishlists')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let totalTime = 0;

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      totalTime += duration;
      totalTests++;

      if (result.error) {
        console.log(`❌ ${test.name}: Error - ${result.error.message}`);
      } else {
        console.log(`✅ ${test.name}: ${result.count || 0} records (${duration}ms)`);
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      totalTests++;
    }
  }

  console.log('\n📊 Performance Summary:');
  console.log(`   ✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`   ⏱️  Total time: ${totalTime}ms`);
  console.log(`   📈 Average query time: ${Math.round(totalTime / totalTests)}ms`);

  // Test some specific queries for performance
  console.log('\n⚡ Query Performance Tests:');
  
  const queryTests = [
    {
      name: 'Trek Search by Region',
      test: async () => {
        const { data, error } = await supabase
          .from('treks')
          .select('id, name, slug, region, difficulty, price')
          .eq('status', true)
          .eq('region', 'Nepal')
          .limit(10);
        return { data, error };
      }
    },
    {
      name: 'Featured Treks Query',
      test: async () => {
        const { data, error } = await supabase
          .from('treks')
          .select('id, name, slug, region, price, image')
          .eq('status', true)
          .eq('featured', true)
          .limit(5);
        return { data, error };
      }
    },
    {
      name: 'Available Slots Query',
      test: async () => {
        const { data, error } = await supabase
          .from('trek_slots')
          .select('trek_slug, date, capacity, booked, status')
          .eq('status', 'open')
          .gte('date', new Date().toISOString().split('T')[0])
          .limit(10);
        return { data, error };
      }
    },
    {
      name: 'Recent Bookings Query',
      test: async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data, error } = await supabase
          .from('bookings')
          .select('id, trek_slug, status, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);
        return { data, error };
      }
    }
  ];

  for (const queryTest of queryTests) {
    try {
      const startTime = Date.now();
      const result = await queryTest.test();
      const duration = Date.now() - startTime;

      if (result.error) {
        console.log(`   ❌ ${queryTest.name}: Error - ${result.error.message}`);
      } else {
        const resultCount = result.data ? result.data.length : 0;
        console.log(`   ✅ ${queryTest.name}: ${resultCount} results (${duration}ms)`);
        
        if (duration > 1000) {
          console.log(`      ⚠️  Slow query detected (${duration}ms) - consider indexing`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ${queryTest.name}: ${error.message}`);
    }
  }

  console.log('\n💡 Indexing Recommendations:');
  console.log('============================');
  console.log('1. 📊 Execute the manual-indexes.sql file in Supabase Dashboard');
  console.log('2. 🔍 Monitor query performance after adding indexes');
  console.log('3. ⚡ Focus on composite indexes for frequently used filter combinations');
  console.log('4. 🧹 Set up regular VACUUM and ANALYZE operations');

  console.log('\n📋 Manual Steps:');
  console.log('================');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Copy content from database/manual-indexes.sql');
  console.log('3. Execute the SQL statements section by section');
  console.log('4. Monitor performance improvements');

  return {
    totalTests,
    passedTests,
    totalTime,
    averageTime: Math.round(totalTime / totalTests)
  };
}

// Run the performance check
if (require.main === module) {
  checkDatabasePerformance()
    .then((results) => {
      console.log('\n✨ Performance check completed!');
      
      if (results.passedTests === results.totalTests) {
        console.log('🎉 All database operations are working correctly!');
      } else {
        console.log(`⚠️  ${results.totalTests - results.passedTests} tests failed - check database connectivity`);
      }
      
      if (results.averageTime > 500) {
        console.log('🐌 Average query time is high - indexing recommended');
      } else {
        console.log('⚡ Query performance looks good!');
      }
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Performance check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabasePerformance };

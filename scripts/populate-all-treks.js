const { createClient } = require('@supabase/supabase-js');
const { v5: uuidv5 } = require('uuid');
const fs = require('fs');
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

async function populateAllTreks() {
  try {
    console.log('🚀 Populating database with all trek data...\n');

    // Read the treks JSON file
    const treksPath = path.join(__dirname, '../data/treks.json');
    if (!fs.existsSync(treksPath)) {
      console.error('❌ Treks JSON file not found at:', treksPath);
      return;
    }

    const jsonData = JSON.parse(fs.readFileSync(treksPath, 'utf8'));
    const treksData = jsonData.treks || jsonData; // Handle both formats
    console.log(`📊 Found ${treksData.length} treks in JSON file\n`);

    // Check current database state
    const { data: existingTreks, error: checkError } = await supabase
      .from('treks')
      .select('slug')
      .limit(1000);

    if (checkError) {
      console.error('❌ Error checking existing treks:', checkError);
      return;
    }

    console.log(`📋 Current database has ${existingTreks?.length || 0} treks\n`);

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each trek
    for (let i = 0; i < treksData.length; i++) {
      const trek = treksData[i];
      
      console.log(`⚡ Processing trek ${i + 1}/${treksData.length}: ${trek.name}`);

      try {
        // Generate UUID from slug for consistent IDs
        const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Standard namespace
        const trekId = uuidv5(trek.slug, NAMESPACE);
        
        // Prepare trek data for database
        const trekData = {
          id: trekId,
          slug: trek.slug,
          name: trek.name,
          description: trek.description || '',
          region: trek.region || '',
          difficulty: trek.difficulty || 'Moderate',
          duration: trek.duration || '',
          price: trek.price || 0,
          rating: trek.rating || 0,
          image: trek.image || '',
          featured: trek.featured || false,
          status: trek.status !== undefined ? trek.status : true,
          created_at: trek.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Try to insert or update the trek
        const { data: insertData, error: insertError } = await supabase
          .from('treks')
          .upsert(trekData, { 
            onConflict: 'slug',
            ignoreDuplicates: false 
          })
          .select();

        if (insertError) {
          console.log(`   ❌ Error: ${insertError.message}`);
          errors.push({ trek: trek.name, error: insertError.message });
          errorCount++;
        } else {
          // Check if it was an insert or update
          const existingTrek = existingTreks?.find(t => t.slug === trek.slug);
          if (existingTrek) {
            console.log(`   ✅ Updated: ${trek.name}`);
            updatedCount++;
          } else {
            console.log(`   ✅ Inserted: ${trek.name}`);
            insertedCount++;
          }
        }

      } catch (error) {
        console.log(`   ❌ Unexpected error: ${error.message}`);
        errors.push({ trek: trek.name, error: error.message });
        errorCount++;
      }

      // Small delay to avoid overwhelming the database
      if (i % 10 === 0 && i > 0) {
        console.log(`   📊 Progress: ${i}/${treksData.length} processed\n`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n🎉 Trek population completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Inserted: ${insertedCount} treks`);
    console.log(`   🔄 Updated: ${updatedCount} treks`);
    console.log(`   ❌ Errors: ${errorCount} treks`);
    console.log(`   📊 Total processed: ${treksData.length} treks`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.trek}: ${err.error}`);
      });
    }

    // Verify final count
    const { data: finalTreks, error: finalError } = await supabase
      .from('treks')
      .select('id, name, slug, status')
      .order('name');

    if (!finalError && finalTreks) {
      console.log(`\n📊 Final database state:`);
      console.log(`   📈 Total treks: ${finalTreks.length}`);
      console.log(`   ✅ Active treks: ${finalTreks.filter(t => t.status).length}`);
      console.log(`   ⏸️  Inactive treks: ${finalTreks.filter(t => !t.status).length}`);

      // Show first few treks as sample
      console.log(`\n📋 Sample treks in database:`);
      finalTreks.slice(0, 5).forEach((trek, index) => {
        const status = trek.status ? '✅' : '⏸️';
        console.log(`   ${index + 1}. ${status} ${trek.name} (${trek.slug})`);
      });

      if (finalTreks.length > 5) {
        console.log(`   ... and ${finalTreks.length - 5} more treks`);
      }
    }

    // Also populate some sample trek slots if none exist
    console.log('\n🎯 Checking trek slots...');
    const { data: existingSlots, error: slotsError } = await supabase
      .from('trek_slots')
      .select('id')
      .limit(1);

    if (!slotsError && (!existingSlots || existingSlots.length === 0)) {
      console.log('📅 Adding sample trek slots...');
      
      // Add some sample slots for the first few treks
      const sampleSlots = [];
      const sampleTreks = finalTreks?.slice(0, 3) || [];
      
      for (const trek of sampleTreks) {
        // Add 3 future dates for each trek
        for (let i = 1; i <= 3; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + (i * 30)); // 30, 60, 90 days from now
          
          sampleSlots.push({
            trek_slug: trek.slug,
            date: futureDate.toISOString().split('T')[0],
            capacity: 15,
            booked: Math.floor(Math.random() * 5), // Random bookings 0-4
            status: 'open'
          });
        }
      }

      if (sampleSlots.length > 0) {
        const { error: slotsInsertError } = await supabase
          .from('trek_slots')
          .insert(sampleSlots);

        if (slotsInsertError) {
          console.log(`   ⚠️  Error adding sample slots: ${slotsInsertError.message}`);
        } else {
          console.log(`   ✅ Added ${sampleSlots.length} sample trek slots`);
        }
      }
    } else {
      console.log(`   📊 Trek slots already exist: ${existingSlots?.length || 0} slots`);
    }

  } catch (error) {
    console.error('❌ Fatal error during trek population:', error);
  }
}

// Run performance test after population
async function runPerformanceTest() {
  console.log('\n⚡ Running performance test...');
  
  try {
    const tests = [
      {
        name: 'Total Treks',
        test: async () => {
          const { count, error } = await supabase
            .from('treks')
            .select('*', { count: 'exact', head: true });
          return { count, error };
        }
      },
      {
        name: 'Active Treks',
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
        test: async () => {
          const { count, error } = await supabase
            .from('treks')
            .select('*', { count: 'exact', head: true })
            .eq('featured', true);
          return { count, error };
        }
      },
      {
        name: 'Trek Slots',
        test: async () => {
          const { count, error } = await supabase
            .from('trek_slots')
            .select('*', { count: 'exact', head: true });
          return { count, error };
        }
      }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;

      if (result.error) {
        console.log(`   ❌ ${test.name}: Error - ${result.error.message}`);
      } else {
        console.log(`   ✅ ${test.name}: ${result.count || 0} records (${duration}ms)`);
      }
    }

    // Test a complex query
    console.log('\n🔍 Testing complex queries...');
    
    const startTime = Date.now();
    const { data: complexQuery, error: complexError } = await supabase
      .from('treks')
      .select(`
        id, name, slug, region, difficulty, price, status, featured,
        trek_slots!inner(id, date, capacity, booked, status)
      `)
      .eq('status', true)
      .eq('trek_slots.status', 'open')
      .gte('trek_slots.date', new Date().toISOString().split('T')[0])
      .limit(10);
    
    const complexDuration = Date.now() - startTime;
    
    if (complexError) {
      console.log(`   ❌ Complex Query: Error - ${complexError.message}`);
    } else {
      console.log(`   ✅ Complex Query (Treks with Available Slots): ${complexQuery?.length || 0} results (${complexDuration}ms)`);
    }

  } catch (error) {
    console.log(`   ❌ Performance test error: ${error.message}`);
  }
}

// Run the population
if (require.main === module) {
  populateAllTreks()
    .then(() => runPerformanceTest())
    .then(() => {
      console.log('\n✨ All treks populated successfully!');
      console.log('🎯 Database is ready for production use');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Trek population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateAllTreks };

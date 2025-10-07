const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate slot dates based on trek characteristics
function generateSlotDates(trek, basePrice) {
  const slots = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  // Determine best months based on region and best time
  let bestMonths = [];
  const bestTime = trek.sections?.overview?.best_time?.toLowerCase() || '';
  const region = trek.region?.toLowerCase() || '';
  
  // Parse best time to extract months
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                     'july', 'august', 'september', 'october', 'november', 'december'];
  
  if (bestTime.includes('year-round') || bestTime.includes('all year')) {
    bestMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // All months
  } else {
    // Extract month names from best time
    monthNames.forEach((month, index) => {
      if (bestTime.includes(month)) {
        bestMonths.push(index);
      }
    });
    
    // If no specific months found, use region-based defaults
    if (bestMonths.length === 0) {
      if (region.includes('nepal')) {
        bestMonths = [2, 3, 4, 9, 10, 11]; // Mar-May, Oct-Dec
      } else if (region.includes('ladakh') || region.includes('kashmir')) {
        bestMonths = [5, 6, 7, 8, 9]; // Jun-Oct
      } else if (region.includes('uttarakhand') || region.includes('himachal')) {
        bestMonths = [3, 4, 5, 8, 9, 10]; // Apr-Jun, Sep-Nov
      } else {
        bestMonths = [3, 4, 5, 9, 10, 11]; // Default: Apr-Jun, Oct-Dec
      }
    }
  }
  
  // Generate slots for next 12 months
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const slotDate = new Date(currentDate.getFullYear(), currentMonth + monthOffset, 1);
    const slotMonth = slotDate.getMonth();
    
    // Determine number of slots based on best months
    let slotsThisMonth = 0;
    if (bestMonths.includes(slotMonth)) {
      slotsThisMonth = Math.random() > 0.3 ? 2 : 1; // 70% chance of 2 slots, 30% chance of 1
    } else {
      slotsThisMonth = Math.random() > 0.7 ? 1 : 0; // 30% chance of 1 slot in off-season
    }
    
    // Generate slots for this month
    for (let slotIndex = 0; slotIndex < slotsThisMonth; slotIndex++) {
      // Generate random date within the month (avoiding first and last few days)
      const dayOfMonth = Math.floor(Math.random() * 20) + 5; // Day 5-25
      const slotDateTime = new Date(slotDate.getFullYear(), slotDate.getMonth(), dayOfMonth);
      
      // Skip past dates
      if (slotDateTime <= currentDate) continue;
      
      // Determine capacity based on difficulty and trek type
      let capacity = 12; // Default capacity
      const difficulty = trek.difficulty?.toLowerCase() || '';
      
      if (difficulty.includes('easy')) {
        capacity = Math.floor(Math.random() * 8) + 15; // 15-22 people
      } else if (difficulty.includes('moderate')) {
        capacity = Math.floor(Math.random() * 6) + 10; // 10-15 people
      } else if (difficulty.includes('difficult') || difficulty.includes('challenging')) {
        capacity = Math.floor(Math.random() * 4) + 6; // 6-9 people
      }
      
      // Generate some pre-bookings (0-30% of capacity)
      const maxPreBookings = Math.floor(capacity * 0.3);
      const booked = Math.floor(Math.random() * (maxPreBookings + 1));
      
      slots.push({
        trek_slug: trek.slug,
        date: slotDateTime.toISOString().split('T')[0],
        capacity: capacity,
        booked: booked,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }
  
  return slots;
}

async function populateTrekSlots() {
  try {
    console.log('🚀 Starting trek slots population...\n');
    
    // Check existing slots
    const { count: existingSlots } = await supabase
      .from('trek_slots')
      .select('*', { count: 'exact', head: true });

    if (existingSlots && existingSlots > 0) {
      console.log(`⚠️ Found ${existingSlots} existing slots. Do you want to continue? (This will add more slots)`);
      console.log('💡 If you want to start fresh, delete existing slots first.');
    }
    
    // Get all treks
    const { data: treks, error: treksError } = await supabase
      .from('treks')
      .select('*')
      .eq('status', true);

    if (treksError) {
      console.error('❌ Error fetching treks:', treksError);
      return;
    }

    console.log(`📊 Found ${treks?.length || 0} active treks`);

    // Read trek JSON data for additional info
    const treksPath = path.join(__dirname, '../data/treks.json');
    const jsonData = JSON.parse(fs.readFileSync(treksPath, 'utf8'));
    const jsonTreks = jsonData.treks || jsonData;

    let totalSlotsGenerated = 0;
    let treksProcessed = 0;

    // Process each trek
    for (const dbTrek of treks || []) {
      try {
        console.log(`\n🔄 Processing: ${dbTrek.name || dbTrek.slug}`);
        
        // Find corresponding JSON data
        const jsonTrek = jsonTreks.find(t => t.slug === dbTrek.slug);
        if (!jsonTrek) {
          console.log(`⚠️ No JSON data found for ${dbTrek.slug}, skipping...`);
          continue;
        }

        // Generate slots for this trek
        const trekSlots = generateSlotDates(jsonTrek, dbTrek.price || 15000);
        
        if (trekSlots.length === 0) {
          console.log(`⚠️ No slots generated for ${dbTrek.slug}`);
          continue;
        }

        console.log(`📅 Generated ${trekSlots.length} slots`);

        // Insert slots in batches
        const batchSize = 10;
        let inserted = 0;

        for (let i = 0; i < trekSlots.length; i += batchSize) {
          const batch = trekSlots.slice(i, i + batchSize);
          
          const { data: insertedSlots, error: insertError } = await supabase
            .from('trek_slots')
            .insert(batch)
            .select('id');

          if (insertError) {
            console.error(`❌ Error inserting batch for ${dbTrek.slug}:`, insertError);
          } else {
            inserted += insertedSlots?.length || 0;
          }
        }

        console.log(`✅ Inserted ${inserted}/${trekSlots.length} slots for ${dbTrek.slug}`);
        totalSlotsGenerated += inserted;
        treksProcessed++;

        // Show sample slots
        const sampleSlots = trekSlots.slice(0, 3);
        sampleSlots.forEach(slot => {
          console.log(`   📅 ${slot.date}: ${slot.booked}/${slot.capacity} booked`);
        });

      } catch (error) {
        console.error(`❌ Error processing trek ${dbTrek.slug}:`, error);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Treks processed: ${treksProcessed}`);
    console.log(`✅ Total slots generated: ${totalSlotsGenerated}`);
    console.log(`📅 Average slots per trek: ${Math.round(totalSlotsGenerated / treksProcessed)}`);

    // Verify final count
    const { count: finalSlotCount } = await supabase
      .from('trek_slots')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🔍 Final verification: ${finalSlotCount} total slots in database`);

    // Show some sample upcoming slots
    const { data: upcomingSlots } = await supabase
      .from('trek_slots')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(5);

    if (upcomingSlots && upcomingSlots.length > 0) {
      console.log('\n🎯 Sample upcoming slots:');
      upcomingSlots.forEach(slot => {
        console.log(`   📅 ${slot.trek_slug}: ${slot.date} (${slot.booked}/${slot.capacity})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

populateTrekSlots().catch(console.error);

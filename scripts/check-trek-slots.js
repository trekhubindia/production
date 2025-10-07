const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTrekSlots() {
  try {
    console.log('🔍 Checking trek slots...\n');
    
    // Get total slot count
    const { count: totalSlots } = await supabase
      .from('trek_slots')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total trek slots: ${totalSlots || 0}`);

    // Get sample slots
    const { data: sampleSlots, error } = await supabase
      .from('trek_slots')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching slots:', error);
      return;
    }

    if (sampleSlots && sampleSlots.length > 0) {
      console.log('\n📅 Sample slots:');
      sampleSlots.forEach(slot => {
        console.log(`   - ${slot.trek_slug}: ${slot.date} (${slot.booked}/${slot.capacity} booked) - ₹${slot.price}`);
      });
    } else {
      console.log('\n⚠️ No trek slots found');
    }

    // Check how many treks have slots
    const { data: treksWithSlots } = await supabase
      .from('trek_slots')
      .select('trek_slug')
      .distinct();

    const uniqueTreksWithSlots = [...new Set(treksWithSlots?.map(s => s.trek_slug) || [])];
    console.log(`\n🏔️ Treks with slots: ${uniqueTreksWithSlots.length}`);

    // Get total trek count
    const { count: totalTreks } = await supabase
      .from('treks')
      .select('*', { count: 'exact', head: true });

    console.log(`🏔️ Total treks: ${totalTreks || 0}`);
    console.log(`📊 Treks without slots: ${(totalTreks || 0) - uniqueTreksWithSlots.length}`);

    if (uniqueTreksWithSlots.length > 0) {
      console.log('\n🎯 Treks with slots:');
      uniqueTreksWithSlots.slice(0, 10).forEach(slug => {
        console.log(`   - ${slug}`);
      });
      if (uniqueTreksWithSlots.length > 10) {
        console.log(`   ... and ${uniqueTreksWithSlots.length - 10} more`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTrekSlots().catch(console.error);

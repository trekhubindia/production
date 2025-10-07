import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
 
export async function GET() {
  console.log('🔍 Debug: Starting admin bookings debug');
  
  // Test basic bookings query
  const { data: basicBookings, error: basicError } = await supabaseAdmin
    .from('bookings')
    .select('id, trek_slug, slot_id, customer_name, status')
    .limit(3);

  console.log('🔍 Debug: Basic bookings:', basicBookings);
  console.log('🔍 Debug: Basic error:', basicError);

  // Test trek join
  const { data: trekJoin, error: trekError } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      trek_slug,
      customer_name,
      treks!inner (
        id,
        name,
        slug
      )
    `)
    .limit(3);

  console.log('🔍 Debug: Trek join:', trekJoin);
  console.log('🔍 Debug: Trek error:', trekError);

  // Test slot join
  const { data: slotJoin, error: slotError } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      trek_slug,
      customer_name,
      trek_slots (
        id,
        date,
        capacity,
        booked
      )
    `)
    .limit(3);

  console.log('🔍 Debug: Slot join:', slotJoin);
  console.log('🔍 Debug: Slot error:', slotError);

  // Test manual join via raw SQL
  const { data: manualJoin, error: manualError } = await supabaseAdmin
    .rpc('exec_sql', {
      sql: `
        SELECT 
          b.id,
          b.trek_slug,
          b.customer_name,
          b.status,
          t.name as trek_name,
          ts.date as trek_date,
          ts.capacity,
          ts.booked
        FROM bookings b
        LEFT JOIN treks t ON b.trek_slug = t.slug
        LEFT JOIN trek_slots ts ON b.slot_id = ts.id
        LIMIT 3
      `
    });

  console.log('🔍 Debug: Manual join:', manualJoin);
  console.log('🔍 Debug: Manual error:', manualError);

  return NextResponse.json({
    debug: 'Admin bookings debug results',
    basicBookings,
    basicError,
    trekJoin,
    trekError,
    slotJoin,
    slotError,
    manualJoin,
    manualError
  });
}

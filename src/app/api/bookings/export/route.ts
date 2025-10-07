import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function toCSV(rows: unknown[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all'; // all | date | slot | trek | user
    const value = searchParams.get('value') || undefined; // date ISO, slot_id, trek_slug, user_id, email
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    let query = supabaseAdmin.from('bookings').select('*');

    switch (scope) {
      case 'date':
        if (!from && !value) {
          return NextResponse.json({ error: 'Provide date "value" or range "from"/"to"' }, { status: 400 });
        }
        if (value) {
          query = query.eq('booking_date', value);
        } else {
          if (from) query = query.gte('booking_date', from);
          if (to) query = query.lte('booking_date', to);
        }
        break;
      case 'slot':
        if (!value) return NextResponse.json({ error: 'slot scope requires value=slot_id' }, { status: 400 });
        query = query.eq('slot_id', value);
        break;
      case 'trek':
        if (!value) return NextResponse.json({ error: 'trek scope requires value=trek_slug' }, { status: 400 });
        query = query.eq('trek_slug', value);
        break;
      case 'user':
        if (!value) return NextResponse.json({ error: 'user scope requires value=user_id or email' }, { status: 400 });
        // try both user_id or customer_email
        query = query.or(`user_id.eq.${value},customer_email.eq.${value}`);
        break;
      default:
        // all
        break;
    }

    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch bookings for export', details: error.message }, { status: 500 });
    }

    const csv = toCSV(data || []);
    const filename = `bookings_${scope}${value ? '_' + value : ''}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



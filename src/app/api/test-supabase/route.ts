import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test the connection by fetching a single trek
    const { data, error } = await supabase
      .from('treks')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        env: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
          supabaseKey: supabaseKey ? 'Set' : 'Not set'
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data,
      count: data?.length || 0,
      env: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
        supabaseKey: supabaseKey ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
        supabaseKey: supabaseKey ? 'Set' : 'Not set'
      }
    }, { status: 500 });
  }
} 
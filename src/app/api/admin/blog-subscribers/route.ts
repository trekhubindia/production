import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to check admin access
async function checkAdminAccess() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    
    if (!sessionCookie) {
      return { isAdmin: false, error: 'No session found' };
    }

    // Get session from Lucia Auth
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('user_id')
      .eq('id', sessionCookie.value)
      .single();
    
    if (sessionError || !session) {
      return { isAdmin: false, error: 'Invalid session' };
    }

    // Check if user has admin role
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user_id)
      .single();

    const isAdmin = userRole?.role === 'admin';
    return { isAdmin, userId: session.user_id };

  } catch (error) {
    console.error('Admin access check error:', error);
    return { isAdmin: false, error: 'Access check failed' };
  }
}

// GET - Get all blog subscribers (admin only)
export async function GET(req: NextRequest) {
  try {
    // Temporarily bypass admin check for testing - REMOVE IN PRODUCTION
    const bypassAuth = req.nextUrl.searchParams.get('bypass') === 'true';
    
    if (!bypassAuth) {
      const { isAdmin, error: authError } = await checkAdminAccess();
      
      if (!isAdmin) {
        return NextResponse.json({ 
          error: authError || 'Admin access required' 
        }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('blog_subscribers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('subscription_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: subscribers, error, count } = await query;

    if (error) {
      console.error('Get subscribers error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch subscribers' 
      }, { status: 500 });
    }

    // Get statistics
    const { data: stats } = await supabaseAdmin
      .from('blog_subscribers')
      .select('status')
      .then(({ data }) => {
        const statsData = data?.reduce((acc, sub) => {
          acc[sub.status] = (acc[sub.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        return {
          data: {
            total: data?.length || 0,
            active: statsData.active || 0,
            unsubscribed: statsData.unsubscribed || 0,
            pending: statsData.pending || 0
          }
        };
      });

    return NextResponse.json({
      subscribers: subscribers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: stats || { total: 0, active: 0, unsubscribed: 0, pending: 0 }
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Add subscriber manually (admin only)
export async function POST(req: NextRequest) {
  try {
    // Temporarily bypass admin check for testing - REMOVE IN PRODUCTION
    const bypassAuth = req.nextUrl.searchParams.get('bypass') === 'true';
    
    if (!bypassAuth) {
      const { isAdmin, error: authError } = await checkAdminAccess();
      
      if (!isAdmin) {
        return NextResponse.json({ 
          error: authError || 'Admin access required' 
        }, { status: 403 });
      }
    }

    const body = await req.json();
    const { email, name, status = 'active' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        error: 'Valid email address is required' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('add_blog_subscriber', {
      subscriber_email: email.toLowerCase().trim(),
      subscriber_name: name?.trim() || null
    });

    if (error) {
      console.error('Add subscriber error:', error);
      return NextResponse.json({ 
        error: 'Failed to add subscriber' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      action: data.action
    });

  } catch (error) {
    console.error('Add subscriber error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function validateUserSession() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return { user: null };
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { user: null };
    }

    if (new Date(session.expires_at) < new Date()) {
      return { user: null };
    }

    const { data: authUser, error: authUserError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email')
      .eq('id', session.user_id)
      .single();

    if (authUserError || !authUser) {
      return { user: null };
    }

    return { user: authUser };
  } catch (error) {
    console.error('Session validation error:', error);
    return { user: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate user session
    const { user } = await validateUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is subscribed in blog_subscribers table
    const { data: subscription, error } = await supabaseAdmin
      .from('blog_subscribers')
      .select('id, email, subscription_date')
      .eq('email', user.email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching newsletter status:', error);
      return NextResponse.json({ error: 'Failed to fetch newsletter status' }, { status: 500 });
    }

    return NextResponse.json({
      subscribed: !!subscription, // User is subscribed if record exists
      subscribedAt: subscription?.subscription_date || null
    });

  } catch (error) {
    console.error('Newsletter status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate user session
    const { user } = await validateUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscribed } = body;

    if (typeof subscribed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 });
    }

    if (subscribed) {
      // Subscribe: Add to blog_subscribers table
      const { error: insertError } = await supabaseAdmin
        .from('blog_subscribers')
        .upsert({
          email: user.email,
          subscription_date: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (insertError) {
        console.error('Error subscribing to newsletter:', insertError);
        return NextResponse.json({ error: 'Failed to subscribe to newsletter' }, { status: 500 });
      }
    } else {
      // Unsubscribe: Remove from blog_subscribers table
      const { error: deleteError } = await supabaseAdmin
        .from('blog_subscribers')
        .delete()
        .eq('email', user.email);

      if (deleteError) {
        console.error('Error unsubscribing from newsletter:', deleteError);
        return NextResponse.json({ error: 'Failed to unsubscribe from newsletter' }, { status: 500 });
      }
    }

    // Log the newsletter subscription change
    const { data: session } = await supabaseAdmin
      .from('user_session')
      .select('activity_log')
      .eq('user_id', user.id)
      .single();

    if (session) {
      const currentActivities = session.activity_log || [];
      const newActivity = {
        timestamp: new Date().toISOString(),
        type: 'newsletter_subscription_change',
        data: { 
          subscribed,
          email: user.email,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      };

      await supabaseAdmin
        .from('user_session')
        .update({
          activity_log: [...currentActivities, newActivity]
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      message: subscribed ? 'Successfully subscribed to newsletter' : 'Successfully unsubscribed from newsletter',
      subscribed
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

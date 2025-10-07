import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email-newsletter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// POST - Subscribe to blog newsletter
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        error: 'Valid email address is required' 
      }, { status: 400 });
    }

    // Use the database function to safely add subscriber
    const { data, error } = await supabaseAdmin.rpc('add_blog_subscriber', {
      subscriber_email: email.toLowerCase().trim(),
      subscriber_name: name?.trim() || null
    });

    if (error) {
      console.error('Subscription error:', error);
      return NextResponse.json({ 
        error: 'Failed to process subscription' 
      }, { status: 500 });
    }

    // Send welcome email for new subscriptions
    if (data.action === 'created') {
      try {
        const emailResult = await sendWelcomeEmail(email, name);
        if (!emailResult.success) {
          console.error('Welcome email failed:', emailResult.error);
          // Don't fail the subscription if email fails
        }
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
        // Don't fail the subscription if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      action: data.action
    });

  } catch (error) {
    console.error('Blog subscription error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET - Get subscription status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required' 
      }, { status: 400 });
    }

    const { data: subscriber, error } = await supabaseAdmin
      .from('blog_subscribers')
      .select('id, email, name, status, subscription_date, verified')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Get subscription error:', error);
      return NextResponse.json({ 
        error: 'Failed to check subscription status' 
      }, { status: 500 });
    }

    return NextResponse.json({
      subscribed: !!subscriber && subscriber.status === 'active',
      subscriber: subscriber || null
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Unsubscribe from newsletter
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required' 
      }, { status: 400 });
    }

    // Use the database function to safely unsubscribe
    const { data, error } = await supabaseAdmin.rpc('unsubscribe_blog_subscriber', {
      subscriber_email: email.toLowerCase().trim()
    });

    if (error) {
      console.error('Unsubscribe error:', error);
      return NextResponse.json({ 
        error: 'Failed to unsubscribe' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: data.success,
      message: data.message
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

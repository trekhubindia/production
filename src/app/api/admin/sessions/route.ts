import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const sessionId = searchParams.get('session_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check if user is admin (you can implement your own admin check)
    // For now, we'll allow access to service role

    if (userId) {
      // Get user's session
      const { data: session, error } = await supabaseAdmin
        .from('user_session')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        session,
        activities: session.activity_log || []
      });
    }

    if (sessionId) {
      // Get specific session activities
      const activities = await supabaseAdmin
        .from('user_session')
        .select('*')
        .eq('id', sessionId)
        .single();

      return NextResponse.json({
        session: activities.data,
        activities: activities.data?.activity_log || []
      });
    }

    // Get all sessions with basic info
    const { data: sessions, error } = await supabaseAdmin
      .from('user_session')
      .select(`
        id,
        user_id,
        expires_at,
        last_activity,
        created_at,
        updated_at,
        jsonb_array_length(activity_log) as activity_count
      `)
      .order('last_activity', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Admin sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'session_id or user_id is required' },
        { status: 400 }
      );
    }

    if (sessionId) {
      // Delete specific session
      const { error } = await supabaseAdmin
        .from('user_session')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json(
          { error: 'Failed to delete session' },
          { status: 500 }
        );
      }
    } else if (userId) {
      // Delete user's session
      const { error } = await supabaseAdmin
        .from('user_session')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user session:', error);
        return NextResponse.json(
          { error: 'Failed to delete user session' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Session deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const action = searchParams.get('action');

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'session_id and action are required' },
        { status: 400 }
      );
    }

    if (action === 'clean_activities') {
      // This functionality was removed from session-utils, so this will now fail.
      // If you need to implement this, you'll need to add it back to session-utils
      // or re-implement it here.
      return NextResponse.json(
        { error: 'clean_activities action is not available' },
        { status: 501 } // 501 Not Implemented
      );
    }

    if (action === 'extend_session') {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabaseAdmin
        .from('user_session')
        .update({
          expires_at: expiresAt,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error extending session:', error);
        return NextResponse.json(
          { error: 'Failed to extend session' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Session extended successfully' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Patch session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
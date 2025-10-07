import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Get user sessions (login history)
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('user_session')
      .select('id, created_at, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (sessionsError) {
      console.error('Error fetching user sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }

    // Get user activation history
    const { data: activationHistory, error: activationError } = await supabaseAdmin
      .from('user_activation')
      .select('id, is_activated, activated_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (activationError) {
      console.error('Error fetching activation history:', activationError);
    }

    // Get role changes history
    const { data: roleHistory, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role, is_active, assigned_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (roleError) {
      console.error('Error fetching role history:', roleError);
    }

    // Combine and format activity logs
    const activityLogs: Array<{
      id: string;
      action: string;
      status: string;
      timestamp: string;
      details: string;
      type: string;
    }> = [];

    // Add session logs
    if (sessions) {
      sessions.forEach(session => {
        activityLogs.push({
          id: session.id,
          action: 'Login Session',
          status: 'success',
          timestamp: session.created_at,
          details: `Session started at ${new Date(session.created_at).toLocaleString()}`,
          type: 'session'
        });
      });
    }

    // Add activation logs
    if (activationHistory) {
      activationHistory.forEach(activation => {
        if (activation.is_activated && activation.activated_at) {
          activityLogs.push({
            id: activation.id,
            action: 'Account Activated',
            status: 'success',
            timestamp: activation.activated_at,
            details: 'User account was activated',
            type: 'activation'
          });
        }
      });
    }

    // Add role change logs
    if (roleHistory) {
      roleHistory.forEach(role => {
        activityLogs.push({
          id: role.id,
          action: `Role Changed to ${role.role}`,
          status: role.is_active ? 'success' : 'warning',
          timestamp: role.assigned_at || role.created_at,
          details: `User role was set to ${role.role}`,
          type: 'role'
        });
      });
    }

    // Sort by timestamp (newest first)
    activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(activityLogs);

  } catch (error) {
    console.error('Error in activity logs API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
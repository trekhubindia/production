import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
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
    if (!authResult.canAccess || !authResult.user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action } = await request.json();
    const { id: userId } = await params;

    if (!['ban', 'unban', 'delete', 'disable', 'enable'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get current user to check if they're trying to ban/delete themselves
    const { data: currentUser } = await supabaseAdmin
      .from('auth_user')
      .select('id')
      .eq('id', authResult.user.id)
      .single();

    if (currentUser?.id === userId) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    if (action === 'delete') {
      // Delete user and all related data in the correct order
      try {
        // First, delete from user_key table (if exists)
        await supabaseAdmin
          .from('user_key')
          .delete()
          .eq('user_id', userId);

        // Delete from user_session table
        await supabaseAdmin
          .from('user_session')
          .delete()
          .eq('user_id', userId);

        // Delete from password_reset_tokens table
        await supabaseAdmin
          .from('password_reset_tokens')
          .delete()
          .eq('user_id', userId);

        // Delete from user_activation table
        await supabaseAdmin
          .from('user_activation')
          .delete()
          .eq('user_id', userId);

        // Delete from user_roles table
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Delete from user_profiles table
        await supabaseAdmin
          .from('user_profiles')
          .delete()
          .eq('user_id', userId);

        // Finally, delete from auth_user table
        const { error: deleteError } = await supabaseAdmin
          .from('auth_user')
          .delete()
          .eq('id', userId);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Error during user deletion:', error);
        return NextResponse.json({ 
          error: 'Failed to delete user due to database constraints',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // For ban/unban/disable/enable, update the user_roles table
    let isActive = true;
    let message = '';
    
    if (action === 'ban' || action === 'disable') {
      isActive = false;
      message = `User ${action === 'ban' ? 'banned' : 'disabled'} successfully`;
    } else if (action === 'unban' || action === 'enable') {
      isActive = true;
      message = `User ${action === 'unban' ? 'unbanned' : 'enabled'} successfully`;
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ is_active: isActive })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user status:', updateError);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Error in user management API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get user details
    const { data: user, error } = await supabaseAdmin
      .from('auth_user')
      .select(`
        id,
        email,
        created_at,
        updated_at,
        provider,
        user_profiles!inner(
          name,
          username,
          avatar_url,
          phone,
          location
        ),
        user_roles!inner(
          role,
          is_active,
          assigned_at
        ),
        user_activation!inner(
          is_activated
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform the data
    const transformedUser = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      provider: user.provider,
      name: user.user_profiles?.[0]?.name || 'No name',
      username: user.user_profiles?.[0]?.username || 'No username',
      avatar_url: user.user_profiles?.[0]?.avatar_url,
      phone: user.user_profiles?.[0]?.phone,
      location: user.user_profiles?.[0]?.location,
      role: user.user_roles?.[0]?.role || 'user',
      is_active: user.user_roles?.[0]?.is_active ?? true,
      is_activated: user.user_activation?.[0]?.is_activated ?? false,
      assigned_at: user.user_roles?.[0]?.assigned_at
    };

    return NextResponse.json(transformedUser);

  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
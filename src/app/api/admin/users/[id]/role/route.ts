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

    // Only owner can change user roles
    const userRole = authResult.user.role;
    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Only owner can change user roles' }, { status: 403 });
    }

    const { role } = await request.json();
    const { id: userId } = await params;

    if (!['user', 'moderator', 'admin', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get current user to check if they're trying to modify themselves
    const { data: currentUser } = await supabaseAdmin
      .from('auth_user')
      .select('id')
      .eq('id', authResult.user.id)
      .single();

    if (currentUser?.id === userId) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
    }

    // Check if user exists and has a role
    const { data: existingRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      console.error('Error checking existing role:', roleError);
      return NextResponse.json({ error: 'Failed to check user role' }, { status: 500 });
    }

    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabaseAdmin
        .from('user_roles')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user role:', updateError);
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
      }
    } else {
      // Create new role entry
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          is_active: true,
          assigned_by: authResult.user.id,
          assigned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating user role:', insertError);
        return NextResponse.json({ error: 'Failed to create user role' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'User role updated successfully',
      role: role
    });

  } catch (error) {
    console.error('Error in role management API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
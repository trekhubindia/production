import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { supabaseAdmin } from '@/lib/supabase';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    console.log('🔒 Admin Users Page: No session found, redirecting to login');
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);
  
  if (!authResult.canAccess) {
    console.log('🔒 Admin Users Page: User not authorized, redirecting to login');
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  // Fetch users data with complete profiles, roles, and activity logs
  const { data: users, error } = await supabaseAdmin
    .from('auth_user')
    .select(`
      id,
      email,
      created_at,
      updated_at,
      provider
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to fetch users data: ${error.message || 'Unknown error'}`);
  }

  // Fetch profiles separately to ensure we get the data
  const userIds = users?.map(user => user.id) || [];
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .in('user_id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }

  // Fetch roles separately
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('user_roles')
    .select('*')
    .in('user_id', userIds);

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
  }

  // Fetch activation data separately
  const { data: activations, error: activationsError } = await supabaseAdmin
    .from('user_activation')
    .select('*')
    .in('user_id', userIds);

  if (activationsError) {
    console.error('Error fetching activations:', activationsError);
  }



  // Fetch session data separately
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('user_session')
    .select('*')
    .in('user_id', userIds);

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError);
  }



  // Transform the data for easier use in the client
  const transformedUsers = users?.map(user => {
    // Get the profile for this user
    const profile = profiles?.find(p => p.user_id === user.id);
    
    // Get the role for this user
    const role = roles?.find(r => r.user_id === user.id);
    
    // Get the activation record for this user
    const activation = activations?.find(a => a.user_id === user.id);
    

    
    // Get session data for this user
    const userSessions = sessions?.filter(s => s.user_id === user.id) || [];
    

    
    // Generate fallback name and username from email if profile is missing
    const emailParts = user.email.split('@');
    const fallbackName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
    const fallbackUsername = emailParts[0];
    
    // Debug logging for profile data
    if (!profile) {
      console.log(`No profile found for user ${user.email}`);
    } else if (!profile.name || !profile.username) {
      console.log(`Profile found but missing name/username for user ${user.email}:`, {
        name: profile.name,
        username: profile.username
      });
    }
    
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      provider: user.provider,
      name: profile?.name || fallbackName,
      username: profile?.username || fallbackUsername,
      avatar_url: profile?.avatar_url,
      phone: profile?.phone,
      location: profile?.location,
      date_of_birth: profile?.date_of_birth,
      gender: profile?.gender,
      bio: profile?.bio,
      website: profile?.website,
      role: role?.role || 'user',
      is_active: role?.is_active ?? true,
      is_activated: activation?.is_activated ?? false,
      assigned_at: role?.assigned_at,
      assigned_by: role?.assigned_by,
      activated_at: activation?.activated_at,
      last_login: userSessions[0]?.created_at || null,
      last_activity: userSessions[0]?.last_activity,
      session_count: userSessions.length,

    };
  }) || [];

  console.log('✅ Admin Users Page: All checks passed, rendering users page');

  // Get current user's role
  const currentUserRole = authResult.user?.role || 'user';

  return (
    <div className="min-h-screen bg-background">
      <AdminUsersClient users={transformedUsers} currentUserRole={currentUserRole} />
    </div>
  );
} 
import { getCompleteUserData } from './auth-utils';
import { supabaseAdmin } from './supabase';

interface User {
  id: string;
  email: string;
  role: string;
  is_activated: boolean;
  created_at: string;
  updated_at: string;
  // Add other user fields as needed
}

/**
 * Check if user can access admin panel
 * This function checks if the user is authenticated, activated, and has admin role
 */
export async function canUserAccessAdmin(sessionId: string): Promise<{
  canAccess: boolean;
  user?: User;
  error?: string;
  redirectUrl?: string;
}> {
  try {
    // Check session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return {
        canAccess: false,
        error: 'Invalid session',
        redirectUrl: '/auth'
      };
    }

    if (new Date(session.expires_at) < new Date()) {
      return {
        canAccess: false,
        error: 'Session expired',
        redirectUrl: '/auth'
      };
    }

    // Get complete user data
    const user = await getCompleteUserData(session.user_id);
    if (!user) {
      return {
        canAccess: false,
        error: 'User not found',
        redirectUrl: '/auth'
      };
    }

    // Check if user is activated
    if (!user.is_activated) {
      return {
        canAccess: false,
        error: 'Account not activated',
        redirectUrl: '/auth/activate'
      };
    }

    // Check if user has admin role
    if (user.role !== 'admin' && user.role !== 'owner') {
      return {
        canAccess: false,
        error: 'Insufficient permissions',
        redirectUrl: '/'
      };
    }

    // User is admin and activated - allow access
    return {
      canAccess: true,
      user
    };

  } catch (error) {
    console.error('Error in canUserAccessAdmin:', error);
    return {
      canAccess: false,
      error: 'Internal server error',
      redirectUrl: '/auth'
    };
  }
} 
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock Lucia instance for now - will be replaced with proper configuration
export const luciaInstance = {
  validateSession: async () => {
    // Mock implementation that returns null for now
    return { session: null, user: null };
  }
};

export type Auth = typeof luciaInstance;

// Simple session validation for rating system
export async function validateRequest(): Promise<{
  user: { id: string; email: string } | null;
  session: { id: string } | null;
}> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    
    if (!sessionCookie) {
      return { user: null, session: null };
    }

    // Get user from session table
    const { data: sessionData, error } = await supabase
      .from('user_session')
      .select('id, user_id, expires_at')
      .eq('id', sessionCookie.value)
      .single();

    if (error || !sessionData) {
      return { user: null, session: null };
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return { user: null, session: null };
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('auth_user')
      .select('id, email')
      .eq('id', sessionData.user_id)
      .single();

    if (userError || !userData) {
      return { user: null, session: null };
    }

    return {
      user: {
        id: userData.id,
        email: userData.email
      },
      session: { id: sessionData.id }
    };
  } catch (error) {
    console.error('Error validating request:', error);
    return { user: null, session: null };
  }
}

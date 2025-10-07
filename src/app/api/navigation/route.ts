import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    let userRole: string | undefined;
    
    // Try to get user role if session exists, but don't fail if it doesn't
    if (sessionId) {
      try {
        const { data: session } = await supabaseAdmin
          .from('user_session')
          .select('user_id')
          .eq('id', sessionId)
          .single();
          
        if (session) {
          const { data: user } = await supabaseAdmin
            .from('auth_user')
            .select('role')
            .eq('id', session.user_id)
            .single();
            
          userRole = user?.role;
        }
      } catch {
        // Session might be invalid, continue without user role
        console.log('Session not found or invalid, continuing without user role');
      }
    }
    
    // Get navigation configuration based on user role (or default for no role)
    // const navigation = getNavigationForUser(userRole); // This line is removed
    
    return NextResponse.json({
      navigation: [], // Placeholder, as getNavigationForUser is removed
      userRole,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching navigation:', error);
    // Return default navigation even if there's an error
    // const navigation = getNavigationForUser(); // This line is removed
    return NextResponse.json({
      navigation: [], // Placeholder, as getNavigationForUser is removed
      userRole: undefined,
      timestamp: new Date().toISOString()
    });
  }
} 
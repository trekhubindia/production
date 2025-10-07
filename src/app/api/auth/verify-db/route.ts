import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Verifying database schema for Google OAuth...');

    // Test inserting a dummy Google user to see if the schema works
    const testUserId = '00000000-0000-0000-0000-000000000999';
    const testEmail = 'test-oauth@example.com';

    // First, clean up any existing test user
    await supabaseAdmin
      .from('auth_user')
      .delete()
      .eq('email', testEmail);

    // Try to insert a test Google OAuth user (correct table structure)
    const { data: testUser, error: insertError } = await supabaseAdmin
      .from('auth_user')
      .insert({
        id: testUserId,
        email: testEmail,
        name: 'Test OAuth User',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'google'
      })
      .select()
      .single();

    let insertResult = {
      success: !insertError,
      error: insertError?.message,
      user: testUser
    };

    // Try to create a test user_activation record
    let activationResult = null;
    if (testUser) {
      const { data: testActivation, error: activationError } = await supabaseAdmin
        .from('user_activation')
        .insert({
          user_id: testUser.id,
          is_activated: true,
          activated_at: new Date().toISOString(),
          activation_method: 'oauth_google'
        })
        .select()
        .single();

      activationResult = {
        success: !activationError,
        error: activationError?.message,
        activation: testActivation
      };

      // Clean up test activation
      if (testActivation) {
        await supabaseAdmin
          .from('user_activation')
          .delete()
          .eq('id', testActivation.id);
      }
    }

    // Try to create a test session
    let sessionResult = null;
    if (testUser) {
      const testSessionId = '00000000-0000-0000-0000-000000000777';
      const { data: testSession, error: sessionError } = await supabaseAdmin
        .from('user_session')
        .insert({
          id: testSessionId,
          user_id: testUser.id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date().toISOString(),
          activity_log: [{ type: 'test', timestamp: new Date().toISOString() }]
        })
        .select()
        .single();

      sessionResult = {
        success: !sessionError,
        error: sessionError?.message,
        session: testSession
      };

      // Clean up test session
      if (testSession) {
        await supabaseAdmin
          .from('user_session')
          .delete()
          .eq('id', testSession.id);
      }
    }

    // Clean up test user
    if (testUser) {
      await supabaseAdmin
        .from('auth_user')
        .delete()
        .eq('id', testUser.id);
    }

    // Get table structure info
    const { data: authUserColumns } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'auth_user' })
      .limit(1);

    const { data: sessionColumns } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'user_session' })
      .limit(1);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        user_insert: insertResult,
        session_insert: sessionResult
      },
      schema: {
        auth_user_columns: authUserColumns || 'Could not fetch',
        user_session_columns: sessionColumns || 'Could not fetch'
      },
      recommendations: insertError ? [
        {
          issue: 'User insert failed',
          solution: 'Check if auth_user table has all required columns',
          error: insertError.message
        }
      ] : []
    });

  } catch (error) {
    console.error('❌ Database verification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

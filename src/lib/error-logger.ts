import { supabaseAdmin } from './supabase';

function isError(error: unknown): error is Error & { code?: string; name?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'stack' in error
  );
}

/**
 * Logs an error to the error_logs table in the database.
 * @param error - The error object or message
 * @param context - A string describing where the error occurred
 */
export async function logErrorToDB(error: unknown, context: string) {
  try {
    await supabaseAdmin.from('error_logs').insert({
      message: isError(error) ? error.message : String(error),
      stack: isError(error) ? error.stack : undefined,
      code: isError(error) ? error.code : undefined,
      name: isError(error) ? error.name : undefined,
      context,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    // fallback logging
    console.error('Failed to log error to DB:', e);
  }
} 
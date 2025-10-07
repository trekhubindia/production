import { cookies } from 'next/headers';

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;
  
  if (!sessionId) {
    return null;
  }

  // For now, we'll use the session ID as the token
  // In a real implementation, you might want to get the actual JWT token
  return sessionId;
} 
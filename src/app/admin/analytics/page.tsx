import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import AdminAnalyticsClient from './AdminAnalyticsClient';

export default async function AdminAnalyticsPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    console.log('🔒 Admin Analytics Page: No session found, redirecting to login');
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);
  
  if (!authResult.canAccess) {
    console.log('🔒 Admin Analytics Page: User not authorized, redirecting to login');
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  console.log('✅ Admin Analytics Page: All checks passed, rendering analytics');

  return <AdminAnalyticsClient />;
}

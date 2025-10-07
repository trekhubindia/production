import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import AdminFAQsClient from './AdminFAQsClient';

export const metadata: Metadata = {
  title: 'FAQ Management | Admin Dashboard',
  description: 'Manage user questions and provide answers for trek FAQs',
};

export default async function AdminFAQsPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    console.log('🔒 Admin FAQs Page: No session found, redirecting to login');
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);
  
  if (!authResult.canAccess) {
    console.log('🔒 Admin FAQs Page: User not authorized, redirecting to login');
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  console.log('✅ Admin FAQs Page: All checks passed, rendering FAQs page');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminFAQsClient />
    </div>
  );
}

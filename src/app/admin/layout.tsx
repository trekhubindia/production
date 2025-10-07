import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);

  // If not authorized, redirect based on the reason
  if (!authResult.canAccess) {
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  return (
    <AdminLayoutClient user={authResult.user as import('@/lib/auth-utils').CompleteUserData}>
      {children}
    </AdminLayoutClient>
  );
} 
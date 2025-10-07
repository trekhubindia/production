import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { getAllTreks } from '@/lib/trek-data';
import AdminTreksClient from './AdminTreksClient';

export default async function AdminTreksPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    console.log('🔒 Admin Treks Page: No session found, redirecting to login');
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);
  
  if (!authResult.canAccess) {
    console.log('🔒 Admin Treks Page: User not authorized, redirecting to login');
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  // Fetch treks data from hybrid system (JSON + database)
  const treks = await getAllTreks();

  console.log('✅ Admin Treks Page: All checks passed, rendering treks page');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminTreksClient treks={treks} />
    </div>
  );
} 
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { supabaseAdmin } from '@/lib/supabase';
import AdminVouchersClient from './AdminVouchersClient';

export default async function AdminVouchersPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    console.log('🔒 Admin Vouchers Page: No session found, redirecting to login');
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);
  
  if (!authResult.canAccess) {
    console.log('🔒 Admin Vouchers Page: User not authorized, redirecting to login');
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  // Fetch vouchers data server-side
  const { data: vouchers, error } = await supabaseAdmin
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouchers:', error.message || error);
    throw new Error('Failed to fetch vouchers data');
  }

  // Transform data for client component
  const transformedVouchers = vouchers?.map(voucher => ({
    ...voucher,
    user_name: voucher.user_id ? `User ${voucher.user_id.slice(0, 8)}` : 'General Voucher',
    user_email: voucher.user_id ? `${voucher.user_id.slice(0, 8)}@example.com` : 'No email'
  })) || [];

  console.log('✅ Admin Vouchers Page: All checks passed, rendering vouchers page');

  return (
    <div className="min-h-screen bg-background">
      <AdminVouchersClient vouchers={transformedVouchers} />
    </div>
  );
} 
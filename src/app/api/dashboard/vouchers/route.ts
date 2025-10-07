import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user session
    const { data: sessionData } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = userData.email;

    // Get URL parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';

    // Get user's vouchers (both user-specific and general vouchers)
    let query = supabaseAdmin
      .from('vouchers')
      .select(`
        id,
        code,
        discount_percent,
        valid_until,
        is_used,
        user_id,
        created_at,
        used_at,
        used_by,
        minimum_amount,
        maximum_discount,
        description
      `)
      .or(`user_id.eq.${sessionData.user_id},user_id.is.null`)
      .order('created_at', { ascending: false });

    const { data: vouchers, error: vouchersError } = await query;

    if (vouchersError) {
      console.error('Error fetching vouchers:', vouchersError);
      return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
    }

    // Format the vouchers data
    let formattedVouchers = vouchers?.map(voucher => {
      const now = new Date();
      const validUntil = voucher.valid_until ? new Date(voucher.valid_until) : null;
      
      // Determine actual status based on dates and usage
      let actualStatus = 'active';
      if (voucher.is_used) {
        actualStatus = 'used';
      } else if (validUntil && now > validUntil) {
        actualStatus = 'expired';
      }

      // Format discount display (handle edge cases)
      const discountDisplay = voucher.discount_percent && voucher.discount_percent > 0 
        ? `${voucher.discount_percent}% OFF` 
        : 'Free Voucher';

      return {
        id: voucher.id,
        code: voucher.code,
        discount_percent: voucher.discount_percent, // Add this for frontend compatibility
        valid_until: voucher.valid_until, // Use snake_case to match frontend interface
        is_used: voucher.is_used, // Add this for frontend compatibility
        user_id: voucher.user_id, // Add this for frontend compatibility
        created_at: voucher.created_at, // Add this for frontend compatibility
        used_at: voucher.used_at, // Add this for frontend compatibility
        used_by: voucher.used_by, // Add this for frontend compatibility
        minimum_amount: voucher.minimum_amount, // Use snake_case
        maximum_discount: voucher.maximum_discount, // Use snake_case
        description: voucher.description || (voucher.discount_percent && voucher.discount_percent > 0 
          ? `Get ${voucher.discount_percent}% discount on your next trek booking!`
          : 'Free voucher for your next trek booking!'),
        // Keep camelCase versions for backward compatibility
        discount: discountDisplay,
        discountType: 'percentage',
        discountValue: voucher.discount_percent,
        validFrom: voucher.created_at,
        validUntil: voucher.valid_until,
        minimumAmount: voucher.minimum_amount || 0,
        maximumDiscount: voucher.maximum_discount || null,
        status: actualStatus,
        used: voucher.is_used,
        usedAt: voucher.used_at,
        createdAt: voucher.created_at,
        daysLeft: validUntil ? Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null,
        isExpired: validUntil ? now > validUntil : false,
        isActive: actualStatus === 'active' && (validUntil ? now <= validUntil : true) && !voucher.is_used
      };
    }) || [];

    // Apply status filter
    if (status !== 'all') {
      formattedVouchers = formattedVouchers.filter(voucher => {
        switch (status) {
          case 'active':
            return voucher.isActive;
          case 'used':
            return voucher.used;
          case 'expired':
            return voucher.isExpired && !voucher.used;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      formattedVouchers = formattedVouchers.filter(voucher =>
        voucher.code.toLowerCase().includes(searchLower) ||
        voucher.description.toLowerCase().includes(searchLower)
      );
    }

    // Group vouchers by status for easy access
    const groupedVouchers = {
      active: formattedVouchers.filter(v => v.isActive),
      used: formattedVouchers.filter(v => v.used),
      expired: formattedVouchers.filter(v => v.isExpired && !v.used),
      upcoming: [], // No upcoming vouchers in current schema
      all: formattedVouchers
    };

    return NextResponse.json({ 
      success: true, 
      vouchers: formattedVouchers,
      grouped: groupedVouchers,
      stats: {
        total: formattedVouchers.length,
        active: groupedVouchers.active.length,
        used: groupedVouchers.used.length,
        expired: groupedVouchers.expired.length,
        upcoming: groupedVouchers.upcoming.length
      }
    });

  } catch (error) {
    console.error('Vouchers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

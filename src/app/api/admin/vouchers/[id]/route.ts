import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logErrorToDB } from '@/lib/error-logger';
import { cookies } from 'next/headers';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permissions
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: voucherId } = await params;
    const updateData = await request.json();

    // Validate voucher exists
    const { data: existingVoucher, error: fetchError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('id', voucherId)
      .single();

    if (fetchError || !existingVoucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Validate update data
    if (updateData.discount_percent && (updateData.discount_percent < 1 || updateData.discount_percent > 100)) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (updateData.max_uses && updateData.max_uses < 1) {
      return NextResponse.json(
        { error: 'Max uses must be at least 1' },
        { status: 400 }
      );
    }

    if (updateData.valid_until && new Date(updateData.valid_until) <= new Date()) {
      return NextResponse.json(
        { error: 'Valid until date must be in the future' },
        { status: 400 }
      );
    }

    // Check if code is being changed and if it already exists
    if (updateData.code && updateData.code !== existingVoucher.code) {
      const { data: codeExists } = await supabaseAdmin
        .from('vouchers')
        .select('id')
        .eq('code', updateData.code.toUpperCase())
        .neq('id', voucherId)
        .single();

      if (codeExists) {
        return NextResponse.json(
          { error: 'Voucher code already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update object
    const updateObject: any = {};

    // Only update provided fields
    if (updateData.code !== undefined) updateObject.code = updateData.code.toUpperCase();
    if (updateData.discount_percent !== undefined) updateObject.discount_percent = updateData.discount_percent;
    if (updateData.valid_until !== undefined) updateObject.valid_until = updateData.valid_until;
    if (updateData.user_id !== undefined) updateObject.user_id = updateData.user_id || null;
    if (updateData.description !== undefined) updateObject.description = updateData.description || null;
    if (updateData.minimum_amount !== undefined) updateObject.minimum_amount = updateData.minimum_amount || null;
    if (updateData.maximum_discount !== undefined) updateObject.maximum_discount = updateData.maximum_discount || null;
    if (updateData.max_uses !== undefined) updateObject.max_uses = updateData.max_uses;
    if (updateData.is_active !== undefined) updateObject.is_active = updateData.is_active;

    // Update voucher
    const { data: voucher, error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update(updateObject)
      .eq('id', voucherId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating voucher:', updateError);
      return NextResponse.json(
        { error: 'Failed to update voucher' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Voucher updated successfully',
      voucher
    });
  } catch (error) {
    console.error('Error in voucher PATCH:', error);
    await logErrorToDB(error, 'api/admin/vouchers/[id] PATCH');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permissions
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: voucherId } = await params;

    // Check if voucher exists
    const { data: existingVoucher, error: fetchError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('id', voucherId)
      .single();

    if (fetchError || !existingVoucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Check if voucher has been used
    if (existingVoucher.is_used) {
      return NextResponse.json(
        { error: 'Cannot delete a voucher that has been used' },
        { status: 400 }
      );
    }

    // Delete voucher
    const { error: deleteError } = await supabaseAdmin
      .from('vouchers')
      .delete()
      .eq('id', voucherId);

    if (deleteError) {
      console.error('Error deleting voucher:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete voucher' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Error in voucher DELETE:', error);
    await logErrorToDB(error, 'api/admin/vouchers/[id] DELETE');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

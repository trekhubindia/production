import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: faq, error } = await supabaseAdmin
      .from('trek_faqs')
      .select(`
        id,
        trek_slug,
        question,
        answer,
        user_name,
        user_email,
        status,
        is_featured,
        answered_by,
        created_at,
        updated_at,
        answered_at,
        treks (
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching FAQ:', error);
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ faq });

  } catch (error) {
    console.error('Get FAQ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { answer, status, is_featured, answered_by } = body;

    // Validate required fields
    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    if (!status || !['pending', 'answered', 'hidden'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the FAQ
    const updateData: any = {
      answer: answer.trim(),
      status,
      is_featured: Boolean(is_featured),
      updated_at: new Date().toISOString()
    };

    // Set answered_by and answered_at when status changes to answered
    if (status === 'answered') {
      updateData.answered_at = new Date().toISOString();
      if (answered_by) {
        updateData.answered_by = answered_by;
      }
    }

    const { data: updatedFAQ, error } = await supabaseAdmin
      .from('trek_faqs')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        trek_slug,
        question,
        answer,
        user_name,
        user_email,
        status,
        is_featured,
        answered_by,
        created_at,
        updated_at,
        answered_at,
        treks (
          name,
          slug
        )
      `)
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'FAQ updated successfully',
      faq: updatedFAQ
    });

  } catch (error) {
    console.error('Update FAQ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('trek_faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' });

  } catch (error) {
    console.error('Delete FAQ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendQAReplyEmail } from '@/lib/email-service';
import sendQAReplyEmailEnhanced from '@/lib/email-service-enhanced';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();
    const { id } = params;
    
    const { status, admin_reply, admin_notes } = body;
    
    // First, get the current message to check if we need to send an email
    const { data: currentMessage, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current message:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch message' },
        { status: 500 }
      );
    }
    
    // Update contact message
    const updateData: any = {};
    if (status) updateData.status = status;
    if (admin_reply !== undefined) updateData.admin_reply = admin_reply;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('contact_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact message:', error);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }
    
    // Send email if admin_reply was added and it's different from the current reply
    if (admin_reply && admin_reply.trim() && admin_reply !== currentMessage.admin_reply) {
      try {
        console.log('Sending Q&A reply email to:', currentMessage.email);
        
        const emailResult = await sendQAReplyEmailEnhanced({
          to: currentMessage.email,
          customerName: currentMessage.name,
          originalQuestion: currentMessage.message,
          adminReply: admin_reply,
          submissionDate: currentMessage.created_at
        });
        
        if (emailResult.success) {
          console.log('✅ Q&A reply email sent successfully');
        } else {
          console.error('❌ Failed to send Q&A reply email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error sending Q&A reply email:', emailError);
        // Don't fail the API call if email fails
      }
    }
    
    return NextResponse.json(
      { message: 'Message updated successfully', data },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Contact message update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin;
    const { id } = params;
    
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact message:', error);
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Message deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Contact message delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

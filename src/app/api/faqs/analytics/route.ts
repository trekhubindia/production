import { NextRequest, NextResponse } from 'next/server';
import { incrementFAQViewCount } from '@/lib/faq-api';

export async function POST(request: NextRequest) {
  try {
    const { faqId, action } = await request.json();

    if (!faqId) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'view':
        await incrementFAQViewCount(faqId);
        return NextResponse.json({ success: true, message: 'View count incremented' });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('FAQ analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

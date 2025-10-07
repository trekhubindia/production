import { NextRequest, NextResponse } from 'next/server';
import { updateFAQPriorityScores } from '@/lib/faq-api';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you can add auth headers if needed)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting FAQ priority score update...');
    
    // Update all FAQ priority scores
    const updatedCount = await updateFAQPriorityScores();
    
    console.log(`✅ Updated priority scores for ${updatedCount} FAQs`);
    
    return NextResponse.json({
      success: true,
      message: `Updated priority scores for ${updatedCount} FAQs`,
      updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FAQ score update cron job failed:', error);
    return NextResponse.json(
      { 
        error: 'FAQ score update failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

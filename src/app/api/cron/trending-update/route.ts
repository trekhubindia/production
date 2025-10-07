import { NextRequest, NextResponse } from 'next/server';
import { trendingService } from '@/lib/trending-service';
import { logErrorToDB } from '@/lib/error-logger';

// This endpoint will be called daily by a cron job service (like Vercel Cron or external cron)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'your-secret-cron-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting daily trending update cron job...');
    const startTime = Date.now();

    // Update all trending data
    const result = await trendingService.updateAllTrendingData();

    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`✅ Cron job completed successfully in ${duration}ms`);
      console.log(`📊 Results: ${result.updated} updated, ${result.errors} errors`);
      
      return NextResponse.json({
        success: true,
        message: 'Trending data updated successfully',
        stats: {
          updated: result.updated,
          errors: result.errors,
          duration: `${duration}ms`
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`❌ Cron job failed after ${duration}ms`);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to update trending data',
        stats: {
          updated: result.updated,
          errors: result.errors,
          duration: `${duration}ms`
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('💥 Cron job error:', error);
    await logErrorToDB(error, 'cron/trending-update');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for manual testing and status checks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'status') {
      // Get latest trending data status
      const trendingTreks = await trendingService.getTrendingTreks(undefined, 5);
      
      return NextResponse.json({
        status: 'active',
        message: 'Trending update service is running',
        latestUpdate: trendingTreks.length > 0 ? trendingTreks[0].last_updated : null,
        sampleTreks: trendingTreks.map(trek => ({
          slug: trek.trek_slug,
          score: trek.trending_score,
          lastUpdated: trek.last_updated
        })),
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'test') {
      // Manual trigger for testing (remove in production)
      console.log('🧪 Manual test trigger for trending update...');
      
      const result = await trendingService.updateAllTrendingData();
      
      return NextResponse.json({
        success: result.success,
        message: 'Manual test completed',
        stats: {
          updated: result.updated,
          errors: result.errors
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      message: 'Trending Update Cron Service',
      endpoints: {
        'POST /api/cron/trending-update': 'Trigger daily update (requires auth token)',
        'GET /api/cron/trending-update?action=status': 'Check service status',
        'GET /api/cron/trending-update?action=test': 'Manual test trigger'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in trending cron GET:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

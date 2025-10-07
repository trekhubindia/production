import { NextRequest, NextResponse } from 'next/server';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { googleAnalytics } from '@/lib/google-analytics';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionId = request.cookies.get('auth_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days';
    const dataType = searchParams.get('type') || 'overview';

    // Calculate date ranges
    const now = new Date();
    let startDate: string;
    let endDate: string;
    let compareStartDate: string;
    let compareEndDate: string;

    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        compareStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        compareEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        compareStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        compareEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        compareStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        compareEndDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        compareStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        compareEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    let analyticsData: any = {};

    switch (dataType) {
      case 'overview':
        analyticsData = await googleAnalytics.getAnalyticsWithComparison(
          startDate, endDate, compareStartDate, compareEndDate
        );
        break;

      case 'pages':
        analyticsData = {
          pageViews: await googleAnalytics.getPageViews(startDate, endDate)
        };
        break;

      case 'traffic':
        analyticsData = {
          trafficSources: await googleAnalytics.getTrafficSources(startDate, endDate)
        };
        break;

      case 'devices':
        analyticsData = {
          deviceData: await googleAnalytics.getDeviceData(startDate, endDate)
        };
        break;

      case 'realtime':
        analyticsData = {
          activeUsers: await googleAnalytics.getRealTimeUsers()
        };
        break;

      case 'all':
        const [overview, pageViews, trafficSources, deviceData, activeUsers] = await Promise.all([
          googleAnalytics.getAnalyticsWithComparison(startDate, endDate, compareStartDate, compareEndDate),
          googleAnalytics.getPageViews(startDate, endDate),
          googleAnalytics.getTrafficSources(startDate, endDate),
          googleAnalytics.getDeviceData(startDate, endDate),
          googleAnalytics.getRealTimeUsers()
        ]);

        analyticsData = {
          overview,
          pageViews,
          trafficSources,
          deviceData,
          activeUsers,
          period,
          dateRange: {
            startDate,
            endDate,
            compareStartDate,
            compareEndDate
          }
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google Analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Google Analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

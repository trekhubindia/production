import { NextRequest, NextResponse } from 'next/server';
import { AdminAnalyticsService } from '@/lib/services/admin-analytics-service';
import { getCompleteUserData } from '@/lib/auth-utils';
import { logErrorToDB } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify user exists and is admin
    const user = await getCompleteUserData(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only admin users can access dashboard data' },
        { status: 403 }
      );
    }

    // Get comprehensive dashboard data
    const dashboardData = await AdminAnalyticsService.getDashboardData();

    return NextResponse.json({
      message: 'Dashboard data retrieved successfully',
      data: dashboardData,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    await logErrorToDB('GET_DASHBOARD_DATA_ERROR', error);
    
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    );
  }
} 
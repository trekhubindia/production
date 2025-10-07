import { NextRequest, NextResponse } from 'next/server';
import { logErrorToDB } from '@/lib/error-logger';
import { activateUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Activation token is required' },
        { status: 400 }
      );
    }

    // Activate user using the new utility function
    const { success, error } = await activateUser(token);

    if (!success) {
      return NextResponse.json(
        { error: error || 'Invalid or expired activation token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Account activated successfully. You can now sign in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Activation error:', error);
    await logErrorToDB(error, 'api/auth/activate POST');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Activation token is required' },
        { status: 400 }
      );
    }

    // Activate user using the new utility function
    const { success, error } = await activateUser(token);

    if (!success) {
      return NextResponse.json(
        { error: error || 'Invalid or expired activation token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Account activated successfully. You can now sign in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Activation error:', error);
    await logErrorToDB(error, 'api/auth/activate GET');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
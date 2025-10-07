"use strict";
import { NextResponse } from 'next/server';
import { discovery, randomState, buildAuthorizationUrl } from 'openid-client';

export async function GET() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  
  // Force localhost for development to avoid 0.0.0.0 issues
  const REDIRECT_URI = BASE_URL?.includes('0.0.0.0') 
    ? `http://localhost:3000/api/auth/google/callback`
    : `${BASE_URL}/api/auth/google/callback`;

  const config = await discovery(
    new URL('https://accounts.google.com'),
    GOOGLE_CLIENT_ID,
    {
                        client_secret: GOOGLE_CLIENT_SECRET,
                        redirect_uris: [REDIRECT_URI],
                        response_types: ['code'],
    }
  );

  const state = randomState();
  const url = buildAuthorizationUrl(config, {
    scope: 'openid email profile',
    state,
    redirect_uri: REDIRECT_URI, // Required for Google OAuth
  });

  return NextResponse.redirect(url);
}

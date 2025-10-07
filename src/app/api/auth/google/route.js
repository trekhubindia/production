"use strict";
import { NextResponse } from 'next/server';
import { discovery, randomState, buildAuthorizationUrl } from 'openid-client';

export async function GET(request) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  
  // Get the actual host from the request for production compatibility
  const requestUrl = new URL(request.url);
  const actualHost = requestUrl.origin;
  
  // Determine the correct redirect URI
  let REDIRECT_URI;
  if (BASE_URL?.includes('0.0.0.0')) {
    // Development: Force localhost
    REDIRECT_URI = `http://localhost:3000/api/auth/google/callback`;
  } else if (BASE_URL) {
    // Use configured BASE_URL
    REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;
  } else {
    // Fallback: Use actual request host (for production)
    REDIRECT_URI = `${actualHost}/api/auth/google/callback`;
  }
  
  console.log('OAuth Debug - Redirect URI:', REDIRECT_URI);

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

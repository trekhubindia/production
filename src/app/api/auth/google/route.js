"use strict";
import { NextResponse } from 'next/server';
import { discovery, randomState, buildAuthorizationUrl } from 'openid-client';

export async function GET() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

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
                        access_type: 'offline',
                        prompt: 'consent',
    redirect_uri: REDIRECT_URI, // Required for Google OAuth
  });

  return NextResponse.redirect(url);
}

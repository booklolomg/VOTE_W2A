import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/session';

export async function GET(request) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;

  // exchange code for token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?error=token_failed', request.url));
  }

  const tokenData = await tokenRes.json();

  // fetch user info
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL('/?error=user_failed', request.url));
  }

  const user = await userRes.json();

  const sessionCookie = createSessionCookie({
    id: user.id,
    username: user.username,
    avatar: user.avatar
  });

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  });

  return response;
}

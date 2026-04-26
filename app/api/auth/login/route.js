import { NextResponse } from 'next/server';

export async function GET(request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;

  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify');

  return NextResponse.redirect(url.toString());
}

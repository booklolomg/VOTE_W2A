import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  let myVote = null;
  try {
    myVote = await kv.get(`vote:${session.id}`);
  } catch (e) {
    console.error('KV error:', e);
  }

  return NextResponse.json({
    user: {
      id: session.id,
      username: session.username,
      avatar: session.avatar
    },
    myVote: myVote || null
  });
}

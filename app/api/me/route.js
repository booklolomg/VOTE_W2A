import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const myVote = await kv.get(`vote:${session.id}`);

  return NextResponse.json({
    user: {
      id: session.id,
      username: session.username,
      avatar: session.avatar
    },
    myVote: myVote || null
  });
}

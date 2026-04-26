import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { side } = await request.json();
  if (side !== 'left' && side !== 'right') {
    return NextResponse.json({ error: 'invalid side' }, { status: 400 });
  }

  const userKey = `vote:${session.id}`;
  const previousVote = await kv.get(userKey);

  // if changing vote, decrement previous count
  if (previousVote && previousVote !== side) {
    await kv.decr(`count:${previousVote}`);
  }

  // only increment if it's a new vote (not re-submitting same side)
  if (previousVote !== side) {
    await kv.incr(`count:${side}`);
  }

  await kv.set(userKey, side);

  const [left, right] = await Promise.all([
    kv.get('count:left'),
    kv.get('count:right')
  ]);

  return NextResponse.json({
    ok: true,
    myVote: side,
    counts: {
      left: Number(left) || 0,
      right: Number(right) || 0
    }
  });
}

// allow user to reset (remove) their vote
export async function DELETE(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userKey = `vote:${session.id}`;
  const previousVote = await kv.get(userKey);

  if (previousVote) {
    await kv.decr(`count:${previousVote}`);
    await kv.del(userKey);
  }

  const [left, right] = await Promise.all([
    kv.get('count:left'),
    kv.get('count:right')
  ]);

  return NextResponse.json({
    ok: true,
    myVote: null,
    counts: {
      left: Number(left) || 0,
      right: Number(right) || 0
    }
  });
}

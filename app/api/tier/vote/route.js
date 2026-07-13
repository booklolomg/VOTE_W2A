import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { getSessionFromRequest } from '@/lib/session';
import { TIER_CONFIG } from '@/lib/tierConfig';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { tierId } = await request.json();
  const validTier = TIER_CONFIG.tiers.some(t => t.id === tierId);
  if (!validTier) {
    return NextResponse.json({ error: 'invalid tier' }, { status: 400 });
  }

  // vote once
  const userKey = `tiervote:${session.id}`;
  const existing = await kv.get(userKey);
  if (existing) {
    return NextResponse.json(
      { error: 'already voted', alreadyVoted: true, myVote: existing },
      { status: 409 }
    );
  }

  await kv.set(userKey, tierId);
  await kv.incr(`tiercount:${tierId}`);

  // return fresh counts
  const counts = {};
  await Promise.all(
    TIER_CONFIG.tiers.map(async (t) => {
      const c = await kv.get(`tiercount:${t.id}`);
      counts[t.id] = Number(c) || 0;
    })
  );

  return NextResponse.json({ ok: true, myVote: tierId, counts });
}

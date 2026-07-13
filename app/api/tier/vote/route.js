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

  const { assignments } = await request.json();

  // validate: every tank must be assigned a valid tier
  const tankIds = TIER_CONFIG.tanks.map(t => t.id);
  const tierIds = TIER_CONFIG.tiers.map(t => t.id);

  if (!assignments || typeof assignments !== 'object') {
    return NextResponse.json({ error: 'invalid assignments' }, { status: 400 });
  }

  for (const tankId of tankIds) {
    if (!tierIds.includes(assignments[tankId])) {
      return NextResponse.json(
        { error: `tank "${tankId}" not assigned to a valid tier` },
        { status: 400 }
      );
    }
  }

  // vote once: reject if already voted
  const userKey = `tiervote:${session.id}`;
  const existing = await kv.get(userKey);
  if (existing) {
    return NextResponse.json(
      { error: 'already voted', alreadyVoted: true },
      { status: 409 }
    );
  }

  // save user's vote + increment counts
  await kv.set(userKey, JSON.stringify(assignments));
  await Promise.all(
    tankIds.map(tankId =>
      kv.incr(`tiercount:${tankId}:${assignments[tankId]}`)
    )
  );

  return NextResponse.json({ ok: true });
}

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

  const userKey = `tiervote:${session.id}`;
  const existing = await kv.get(userKey);

  // ถ้าเคยโหวตไว้ ให้ลดคะแนนของ tier เก่าก่อน (เปลี่ยนใจ)
  if (existing && existing !== tierId) {
    await kv.decr(`tiercount:${existing}`);
  }
  if (existing !== tierId) {
    await kv.incr(`tiercount:${tierId}`);
  }

  await kv.set(userKey, tierId);

  const counts = {};
  await Promise.all(
    TIER_CONFIG.tiers.map(async (t) => {
      const c = await kv.get(`tiercount:${t.id}`);
      counts[t.id] = Number(c) || 0;
    })
  );

  return NextResponse.json({ ok: true, myVote: tierId, counts });
}

export async function DELETE(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userKey = `tiervote:${session.id}`;
  const existing = await kv.get(userKey);

  if (existing) {
    await kv.decr(`tiercount:${existing}`);
    await kv.del(userKey);
  }

  const counts = {};
  await Promise.all(
    TIER_CONFIG.tiers.map(async (t) => {
      const c = await kv.get(`tiercount:${t.id}`);
      counts[t.id] = Number(c) || 0;
    })
  );

  return NextResponse.json({ ok: true, myVote: null, counts });
}

import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/session';
import { TIER_CONFIG } from '@/lib/tierConfig';
import { kv } from '@/lib/kv';
import TierApp from './TierApp';
import './tier.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tier List — Vote'
};

export default async function TierPage() {
  const sessionCookie = cookies().get('session')?.value;
  const session = verifySessionCookie(sessionCookie);

  let initial = {
    user: null,
    myVote: null,
    counts: {}
  };

  try {
    if (session) {
      initial.user = { id: session.id, username: session.username };
      const v = await kv.get(`tiervote:${session.id}`);
      initial.myVote = v ? JSON.parse(v) : null;
    }

    const counts = {};
    await Promise.all(
      TIER_CONFIG.tanks.map(async (tank) => {
        counts[tank.id] = {};
        await Promise.all(
          TIER_CONFIG.tiers.map(async (tier) => {
            const c = await kv.get(`tiercount:${tank.id}:${tier.id}`);
            counts[tank.id][tier.id] = Number(c) || 0;
          })
        );
      })
    );
    initial.counts = counts;
  } catch (e) {
    console.error('KV error:', e);
  }

  return <TierApp config={TIER_CONFIG} initial={initial} />;
}

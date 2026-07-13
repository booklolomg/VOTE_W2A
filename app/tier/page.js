import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/session';
import { TIER_CONFIG } from '@/lib/tierConfig';
import { kv } from '@/lib/kv';
import TierApp from './TierApp';
import './tier.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tier Vote'
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
      initial.myVote = v || null;
    }

    const counts = {};
    await Promise.all(
      TIER_CONFIG.tiers.map(async (t) => {
        const c = await kv.get(`tiercount:${t.id}`);
        counts[t.id] = Number(c) || 0;
      })
    );
    initial.counts = counts;
  } catch (e) {
    console.error('KV error:', e);
    TIER_CONFIG.tiers.forEach(t => { initial.counts[t.id] = 0; });
    if (session) {
      initial.user = { id: session.id, username: session.username };
    }
  }

  return <TierApp config={TIER_CONFIG} initial={initial} />;
}

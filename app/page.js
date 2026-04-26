import { kv } from '@/lib/kv';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/session';
import { POLL_CONFIG } from '@/lib/config';
import VoteApp from './VoteApp';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sessionCookie = cookies().get('session')?.value;
  const session = verifySessionCookie(sessionCookie);

  let initial = {
    user: null,
    myVote: null,
    counts: { left: 0, right: 0 }
  };

  try {
    const [left, right] = await Promise.all([
      kv.get('count:left'),
      kv.get('count:right')
    ]);
    initial.counts = {
      left: Number(left) || 0,
      right: Number(right) || 0
    };

    if (session) {
      initial.user = {
        id: session.id,
        username: session.username,
        avatar: session.avatar
      };
      const myVote = await kv.get(`vote:${session.id}`);
      initial.myVote = myVote || null;
    }
  } catch (e) {
    console.error('KV error:', e);
    if (session) {
      initial.user = {
        id: session.id,
        username: session.username,
        avatar: session.avatar
      };
    }
  }

  return <VoteApp config={POLL_CONFIG} initial={initial} />;
}

import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key') ||
                   request.nextUrl.searchParams.get('key');

  if (!process.env.ADMIN_KEY) {
    return NextResponse.json(
      { error: 'ADMIN_KEY not configured on server' },
      { status: 500 }
    );
  }

  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // left/right vote keys
    await kv.del('count:left');
    await kv.del('count:right');

    const voteKeys = await kv.scanKeys('vote:*');
    const tierVoteKeys = await kv.scanKeys('tiervote:*');
    const tierCountKeys = await kv.scanKeys('tiercount:*');

    const allKeys = [...voteKeys, ...tierVoteKeys, ...tierCountKeys];
    await Promise.all(allKeys.map(k => kv.del(k)));

    return NextResponse.json({
      ok: true,
      message: 'reset complete',
      deletedVotes: voteKeys.length,
      deletedTierVotes: tierVoteKeys.length
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

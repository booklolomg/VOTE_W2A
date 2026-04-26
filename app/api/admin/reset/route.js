import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // check admin key from header or query
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

  const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
  if (!REDIS_URL) {
    return NextResponse.json({ error: 'redis not configured' }, { status: 500 });
  }

  const client = createClient({ url: REDIS_URL });
  await client.connect();

  try {
    // delete count keys
    await client.del('count:left');
    await client.del('count:right');

    // delete all individual vote keys
    let cursor = 0;
    let deletedVotes = 0;
    do {
      const result = await client.scan(cursor, { MATCH: 'vote:*', COUNT: 100 });
      cursor = result.cursor;
      const keys = result.keys;
      if (keys.length > 0) {
        await client.del(keys);
        deletedVotes += keys.length;
      }
    } while (cursor !== 0);

    await client.disconnect();

    return NextResponse.json({
      ok: true,
      message: 'reset complete',
      deletedVotes
    });
  } catch (e) {
    await client.disconnect().catch(() => {});
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

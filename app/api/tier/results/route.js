import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { TIER_CONFIG } from '@/lib/tierConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  const counts = {};
  try {
    await Promise.all(
      TIER_CONFIG.tiers.map(async (t) => {
        const c = await kv.get(`tiercount:${t.id}`);
        counts[t.id] = Number(c) || 0;
      })
    );
  } catch (e) {
    console.error('KV error:', e);
    TIER_CONFIG.tiers.forEach(t => { counts[t.id] = 0; });
  }
  return NextResponse.json({ counts });
}

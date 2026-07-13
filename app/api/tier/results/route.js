import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { TIER_CONFIG } from '@/lib/tierConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  const counts = {};
  try {
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
  } catch (e) {
    console.error('KV error:', e);
  }
  return NextResponse.json({ counts });
}

import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [left, right] = await Promise.all([
      kv.get('count:left'),
      kv.get('count:right')
    ]);

    return NextResponse.json({
      counts: {
        left: Number(left) || 0,
        right: Number(right) || 0
      }
    });
  } catch (e) {
    console.error('KV error:', e);
    return NextResponse.json({
      counts: { left: 0, right: 0 }
    });
  }
}

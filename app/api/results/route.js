import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
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
}

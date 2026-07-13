import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // สมมติว่าโครงสร้างข้อมูลใน KV ถูกเก็บไว้ที่ Key 'tier_results'
    const results = await kv.get('tier_results') || {};
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
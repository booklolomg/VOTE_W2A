// Simple KV wrapper using REST API (works with both old Vercel KV and new Upstash Redis)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvFetch(command) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error('KV not configured: missing KV_REST_API_URL or KV_REST_API_TOKEN');
  }
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command),
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.result;
}

export const kv = {
  async get(key) {
    return kvFetch(['GET', key]);
  },
  async set(key, value) {
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    return kvFetch(['SET', key, v]);
  },
  async del(key) {
    return kvFetch(['DEL', key]);
  },
  async incr(key) {
    return kvFetch(['INCR', key]);
  },
  async decr(key) {
    return kvFetch(['DECR', key]);
  }
};

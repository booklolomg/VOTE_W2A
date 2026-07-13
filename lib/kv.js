// Supports both Vercel Redis (connection string) and Upstash Redis (REST API)
import { createClient } from 'redis';

let client = null;
let connecting = null;

async function getClient() {
  const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;

  if (!REDIS_URL) {
    throw new Error('Redis not configured: missing REDIS_URL');
  }

  if (client && client.isOpen) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    const c = createClient({ url: REDIS_URL });
    c.on('error', (err) => console.error('Redis error:', err));
    await c.connect();
    client = c;
    connecting = null;
    return c;
  })();

  return connecting;
}

// REST API fallback (Upstash REST)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const useRestApi = !!(KV_URL && KV_TOKEN);

async function restFetch(command) {
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
    if (useRestApi) return restFetch(['GET', key]);
    const c = await getClient();
    return c.get(key);
  },
  async set(key, value) {
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    if (useRestApi) return restFetch(['SET', key, v]);
    const c = await getClient();
    return c.set(key, v);
  },
  async del(key) {
    if (useRestApi) return restFetch(['DEL', key]);
    const c = await getClient();
    return c.del(key);
  },
  async incr(key) {
    if (useRestApi) return restFetch(['INCR', key]);
    const c = await getClient();
    return c.incr(key);
  },
  async decr(key) {
    if (useRestApi) return restFetch(['DECR', key]);
    const c = await getClient();
    return c.decr(key);
  },
  // คืน keys ทั้งหมดที่ match pattern เช่น 'vote:*'
  async scanKeys(pattern) {
    if (useRestApi) {
      let cursor = '0';
      const keys = [];
      do {
        const res = await restFetch(['SCAN', cursor, 'MATCH', pattern, 'COUNT', '100']);
        cursor = String(res[0]);
        keys.push(...res[1]);
      } while (cursor !== '0');
      return keys;
    }
    const c = await getClient();
    const keys = [];
    let cursor = 0;
    do {
      const r = await c.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = r.cursor;
      keys.push(...r.keys);
    } while (cursor !== 0);
    return keys;
  }
};

import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-please-change';

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

export function createSessionCookie(user) {
  const payload = JSON.stringify({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    iat: Date.now()
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function verifySessionCookie(cookieValue) {
  if (!cookieValue) return null;
  const [b64, sig] = cookieValue.split('.');
  if (!b64 || !sig) return null;
  if (sign(b64) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    // 7 days
    if (Date.now() - payload.iat > 7 * 24 * 60 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request) {
  const cookie = request.cookies.get('session')?.value;
  return verifySessionCookie(cookie);
}

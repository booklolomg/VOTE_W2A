'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleReset() {
    if (!adminKey) {
      setStatus({ type: 'error', message: 'กรุณาใส่ Admin Key' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey }
      });
      const data = await res.json();
      if (data.ok) {
        setStatus({
          type: 'success',
          message: `รีเซ็ตสำเร็จ! ลบโหวตไป ${data.deletedVotes} คน`
        });
        setConfirming(false);
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'เกิดข้อผิดพลาด'
        });
      }
    } catch (e) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="corner tl"></div>
        <div className="corner tr"></div>
        <div className="corner bl"></div>
        <div className="corner br"></div>

        <div className="login-label">— ADMIN PANEL —</div>
        <h1 className="login-title" style={{ fontSize: '2.5rem' }}>
          RESET VOTES
        </h1>

        <p className="login-text" style={{ marginBottom: '1.5rem' }}>
          ล้างคะแนนโหวตทั้งหมด<br />
          <span className="muted">ทุกคนจะต้องโหวตใหม่</span>
        </p>

        <input
          type="password"
          placeholder="ใส่ Admin Key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{
            width: '100%',
            padding: '0.9rem 1rem',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            marginBottom: '1.5rem',
            outline: 'none'
          }}
        />

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={loading || !adminKey}
            className="discord-btn"
            style={{
              background: '#ff3d3d',
              borderColor: '#ff3d3d',
              width: '100%',
              justifyContent: 'center',
              opacity: !adminKey ? 0.5 : 1,
              cursor: !adminKey ? 'not-allowed' : 'pointer'
            }}
          >
            🗑️ รีเซ็ตคะแนนทั้งหมด
          </button>
        ) : (
          <div>
            <p style={{
              color: '#ff3d3d',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              ⚠️ ยืนยันการลบ? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="btn"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="btn btn-confirm"
                style={{ background: '#ff3d3d', borderColor: '#ff3d3d', color: 'white' }}
              >
                {loading ? '...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        )}

        {status && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            border: `1px solid ${status.type === 'success' ? '#4ade80' : '#ff3d3d'}`,
            color: status.type === 'success' ? '#4ade80' : '#ff3d3d',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.85rem'
          }}>
            {status.message}
          </div>
        )}

        <a
          href="/"
          style={{
            display: 'block',
            marginTop: '2rem',
            color: 'var(--muted)',
            fontSize: '0.8rem',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.15em',
            textDecoration: 'none'
          }}
        >
          ← กลับไปหน้าโหวต
        </a>
      </div>
    </div>
  );
}

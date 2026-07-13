'use client';

import { useState, useEffect } from 'react';

export default function TierApp({ config, initial }) {
  const [user] = useState(initial.user);
  const [myVote, setMyVote] = useState(initial.myVote);
  const [counts, setCounts] = useState(initial.counts);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // realtime: poll ทุก 3 วินาที (ทั้งก่อนและหลังโหวต)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/tier/results');
        const data = await r.json();
        if (data.counts) setCounts(data.counts);
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, []);

  async function handleConfirm() {
    if (!pendingChoice || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch('/api/tier/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: pendingChoice })
      });
      const data = await r.json();
      if (data.ok) {
        setMyVote(data.myVote);
        setCounts(data.counts);
        setPendingChoice(null);
      } else if (data.alreadyVoted) {
        setMyVote(data.myVote);
        setPendingChoice(null);
        setError('คุณโหวตไปแล้ว — โหวตได้ครั้งเดียว');
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setPendingChoice(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ===== คำนวณค่าเฉลี่ย =====
  const total = config.tiers.reduce((s, t) => s + (counts[t.id] || 0), 0);
  const avgScore = total
    ? config.tiers.reduce((s, t) => s + t.score * (counts[t.id] || 0), 0) / total
    : 0;

  // tier ที่ใกล้ค่าเฉลี่ยที่สุด
  let avgTier = null;
  if (total > 0) {
    avgTier = config.tiers.reduce((best, t) =>
      Math.abs(t.score - avgScore) < Math.abs(best.score - avgScore) ? t : best
    );
  }

  const maxCount = Math.max(1, ...config.tiers.map(t => counts[t.id] || 0));

  // ===== NOT LOGGED IN =====
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="corner tl"></div>
          <div className="corner tr"></div>
          <div className="corner bl"></div>
          <div className="corner br"></div>
          <div className="login-label">— SIGN IN REQUIRED —</div>
          <h1 className="login-title">{config.question}</h1>
          <p className="login-text">
            ต้องยืนยันตัวด้วย Discord ก่อนโหวต<br />
            <span className="muted">หลัง login เสร็จ กลับมาที่หน้านี้อีกครั้ง (/tier)</span>
          </p>
          <a href="/api/auth/login" className="discord-btn">
            เข้าสู่ระบบด้วย Discord
          </a>
        </div>
      </div>
    );
  }

  const votedTier = myVote ? config.tiers.find(t => t.id === myVote) : null;

  return (
    <div className="tier-container">
      <header className="main-header">
        <div className="logo">TIER<span>/</span>VOTE <span>—</span> LIVE</div>
        <div className="user-info">
          <div className="dot"></div>
          <span className="username">{user.username}</span>
        </div>
      </header>

      <section className="question-section">
        <div className="question-label">— THE QUESTION —</div>
        <h1 className="question">{config.question}</h1>
        {config.imageUrl ? (
          <div
            className="tier-subject-img"
            style={{ backgroundImage: `url('${config.imageUrl}')` }}
          ></div>
        ) : null}
        <div className="vs-text">{myVote ? 'LIVE RESULTS' : 'PICK ONE TIER'}</div>
      </section>

      <main className="tier-main">
        {/* ===== ค่าเฉลี่ย ===== */}
        {total > 0 && (
          <div className="tier-average">
            <div className="tier-average-label">— AVERAGE —</div>
            <div
              className="tier-average-value"
              style={{ background: avgTier?.color || 'transparent' }}
            >
              {avgTier?.name || '—'}
            </div>
            <div className="tier-average-score">
              คะแนนเฉลี่ย {avgScore.toFixed(2)} / 5.00 · {total} โหวต
            </div>
          </div>
        )}

        {/* ===== แถบ tier — กดโหวตได้ / แสดงผล ===== */}
        <div className="tier-bars">
          {config.tiers.map(tier => {
            const c = counts[tier.id] || 0;
            const pct = total ? Math.round((c / total) * 100) : 0;
            const isMine = myVote === tier.id;
            return (
              <div
                key={tier.id}
                className={`tier-bar-row ${!myVote ? 'clickable' : ''} ${isMine ? 'mine' : ''}`}
                onClick={() => !myVote && setPendingChoice(tier.id)}
              >
                <div className="tier-bar-label" style={{ background: tier.color }}>
                  {tier.name}
                </div>
                <div className="tier-bar-track">
                  <div
                    className="tier-bar-fill"
                    style={{
                      width: total ? `${(c / maxCount) * 100}%` : '0%',
                      background: tier.color
                    }}
                  ></div>
                  <span className="tier-bar-stat">
                    {c} โหวต · {pct}%
                    {isMine ? ' ← คุณ' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="tier-footer-note">
          {myVote
            ? `YOU VOTED "${votedTier?.name}" · UPDATES EVERY 3S`
            : 'กดแถบ tier ที่ต้องการเพื่อโหวต · โหวตได้ครั้งเดียว'}
        </div>
      </main>

      {error && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255, 61, 61, 0.15)', border: '1px solid #ff3d3d',
          color: '#ff3d3d', padding: '0.8rem 1.5rem', zIndex: 300,
          fontFamily: 'Sarabun, sans-serif', fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      {/* CONFIRM MODAL */}
      {pendingChoice && (
        <div className="modal-overlay" onClick={() => setPendingChoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>
            <div className="modal-label">— CONFIRM YOUR VOTE —</div>
            <div
              className="tier-modal-choice"
              style={{ background: config.tiers.find(t => t.id === pendingChoice)?.color }}
            >
              {config.tiers.find(t => t.id === pendingChoice)?.name}
            </div>
            <div className="modal-warning">
              คุณกำลังจะโหวต tier นี้<br />
              <strong style={{ color: '#ff3d3d' }}>โหวตแล้วแก้ไขไม่ได้</strong> — โหวตได้ครั้งเดียว
            </div>
            <div className="modal-buttons">
              <button className="btn" onClick={() => setPendingChoice(null)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-confirm"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? '...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

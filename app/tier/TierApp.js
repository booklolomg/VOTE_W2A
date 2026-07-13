'use client';

import { useState, useEffect } from 'react';

export default function TierApp({ config, initial }) {
  const [user] = useState(initial.user);
  const [myVote, setMyVote] = useState(initial.myVote);
  const [counts, setCounts] = useState(initial.counts);
  const [assignments, setAssignments] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const totalTanks = config.tanks.length;
  const assignedCount = Object.keys(assignments).length;
  const allAssigned = assignedCount === totalTanks;

  // poll results every 8s after voting
  useEffect(() => {
    if (!myVote) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/tier/results');
        const data = await r.json();
        if (data.counts) setCounts(data.counts);
      } catch {}
    }, 8000);
    return () => clearInterval(id);
  }, [myVote]);

  function assign(tankId, tierId) {
    setAssignments(prev => ({ ...prev, [tankId]: tierId }));
  }

  async function handleSubmit() {
    if (!allAssigned || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch('/api/tier/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });
      const data = await r.json();
      if (data.ok) {
        setMyVote(assignments);
        setConfirming(false);
        // refresh counts
        const rr = await fetch('/api/tier/results');
        const dd = await rr.json();
        if (dd.counts) setCounts(dd.counts);
      } else if (data.alreadyVoted) {
        setError('คุณโหวตไปแล้ว — โหวตได้ครั้งเดียว');
        setConfirming(false);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function getTier(tierId) {
    return config.tiers.find(t => t.id === tierId);
  }

  // compute mode: which tier each tank belongs to based on most votes
  function computeBoard() {
    const board = {};
    config.tiers.forEach(t => { board[t.id] = []; });

    config.tanks.forEach(tank => {
      const tankCounts = counts[tank.id] || {};
      let bestTier = null;
      let bestCount = 0;
      // iterate tiers in order — ties go to the better (earlier) tier
      config.tiers.forEach(tier => {
        const c = tankCounts[tier.id] || 0;
        if (c > bestCount) {
          bestCount = c;
          bestTier = tier.id;
        }
      });
      if (bestTier) {
        board[bestTier].push({ ...tank, votes: bestCount });
      }
    });
    return board;
  }

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
          <h1 className="login-title">{config.title}</h1>
          <p className="login-text">
            ต้องยืนยันตัวด้วย Discord ก่อนจัดอันดับ<br />
            <span className="muted">หลัง login เสร็จ กลับมาที่หน้านี้อีกครั้ง (/tier)</span>
          </p>
          <a href="/api/auth/login" className="discord-btn">
            เข้าสู่ระบบด้วย Discord
          </a>
        </div>
      </div>
    );
  }

  // ===== VOTED: RESULTS BOARD =====
  if (myVote) {
    const board = computeBoard();
    return (
      <div className="tier-container">
        <header className="main-header">
          <div className="logo">TIER<span>/</span>LIST <span>—</span> RESULTS</div>
          <div className="user-info">
            <div className="dot"></div>
            <span className="username">{user.username}</span>
          </div>
        </header>

        <section className="question-section">
          <div className="question-label">— COMMUNITY RESULTS —</div>
          <h1 className="question">{config.question}</h1>
          <div className="vs-text">MOST VOTED TIER</div>
        </section>

        <main className="tier-main">
          {config.tiers.map(tier => (
            <div className="tier-row" key={tier.id}>
              <div className="tier-label" style={{ background: tier.color }}>
                {tier.name}
              </div>
              <div className="tier-items">
                {board[tier.id].length === 0 && (
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
                )}
                {board[tier.id].map(tank => (
                  <div className="tier-chip" key={tank.id}>
                    {tank.imageUrl ? (
                      <div
                        className="tier-chip-img"
                        style={{ backgroundImage: `url('${tank.imageUrl}')` }}
                      ></div>
                    ) : null}
                    <span className="tier-chip-name">{tank.name}</span>
                    <span className="tier-chip-count">{tank.votes} vote{tank.votes > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="tier-footer-note">
            YOU HAVE VOTED · RESULTS UPDATE LIVE
          </div>
        </main>
      </div>
    );
  }

  // ===== ASSIGN MODE =====
  return (
    <div className="tier-container">
      <header className="main-header">
        <div className="logo">TIER<span>/</span>LIST <span>—</span> v1.0</div>
        <div className="user-info">
          <div className="dot"></div>
          <span className="username">{user.username}</span>
        </div>
      </header>

      <section className="question-section">
        <div className="question-label">— RANK THEM ALL —</div>
        <h1 className="question">{config.question}</h1>
        <div className="vs-text">ASSIGN EVERY TANK</div>
      </section>

      <main className="tier-main">
        <div className="tier-progress">
          จัดแล้ว <strong>{assignedCount}</strong> / {totalTanks} คัน
        </div>

        {config.tanks.map(tank => {
          const selectedTier = assignments[tank.id]
            ? getTier(assignments[tank.id])
            : null;
          return (
            <div
              className={`tank-card ${selectedTier ? 'assigned' : ''}`}
              key={tank.id}
            >
              <div className="tank-header">
                {tank.imageUrl ? (
                  <div
                    className="tank-thumb"
                    style={{ backgroundImage: `url('${tank.imageUrl}')` }}
                  ></div>
                ) : null}
                <div className="tank-name">{tank.name}</div>
                {selectedTier && (
                  <div
                    className="tank-assigned-label"
                    style={{ background: selectedTier.color }}
                  >
                    {selectedTier.name}
                  </div>
                )}
              </div>
              <div className="tier-buttons">
                {config.tiers.map(tier => (
                  <button
                    key={tier.id}
                    className={`tier-btn ${assignments[tank.id] === tier.id ? 'selected' : ''}`}
                    style={
                      assignments[tank.id] === tier.id
                        ? { background: tier.color }
                        : {}
                    }
                    onClick={() => assign(tank.id, tier.id)}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <div className="tier-submit-bar">
        <span className="tier-progress" style={{ margin: 0 }}>
          {allAssigned
            ? '✓ ครบแล้ว พร้อมส่ง'
            : `เหลืออีก ${totalTanks - assignedCount} คัน`}
        </span>
        <button
          className="tier-submit-btn"
          disabled={!allAssigned || submitting}
          onClick={() => setConfirming(true)}
        >
          ส่งคำตอบ
        </button>
      </div>

      {error && (
        <div style={{
          position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255, 61, 61, 0.15)', border: '1px solid #ff3d3d',
          color: '#ff3d3d', padding: '0.8rem 1.5rem', zIndex: 300,
          fontFamily: 'Sarabun, sans-serif', fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>
            <div className="modal-label">— CONFIRM YOUR RANKING —</div>
            <div className="modal-warning" style={{ marginTop: '1rem' }}>
              ส่งการจัดอันดับทั้งหมด {totalTanks} คัน?<br />
              <strong style={{ color: '#ff3d3d' }}>ส่งแล้วแก้ไขไม่ได้</strong> — โหวตได้ครั้งเดียว
            </div>
            <div className="modal-buttons">
              <button className="btn" onClick={() => setConfirming(false)}>
                กลับไปแก้
              </button>
              <button
                className="btn btn-confirm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '...' : 'ยืนยันส่ง'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

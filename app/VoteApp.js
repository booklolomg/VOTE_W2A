'use client';

import { useState, useEffect } from 'react';

export default function VoteApp({ config, initial }) {
  const [user, setUser] = useState(initial.user);
  const [myVote, setMyVote] = useState(initial.myVote);
  const [counts, setCounts] = useState(initial.counts);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!myVote) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/results');
        const data = await r.json();
        setCounts(data.counts);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [myVote]);

  async function handleConfirm() {
    if (!pendingChoice || submitting) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side: pendingChoice })
      });
      const data = await r.json();
      if (data.ok) {
        setMyVote(data.myVote);
        setCounts(data.counts);
        setPendingChoice(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setSubmitting(true);
    try {
      const r = await fetch('/api/vote', { method: 'DELETE' });
      const data = await r.json();
      if (data.ok) {
        setMyVote(null);
        setCounts(data.counts);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMyVote(null);
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setPendingChoice(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const total = counts.left + counts.right;
  const leftPct = total ? Math.round((counts.left / total) * 100) : 0;
  const rightPct = total ? 100 - leftPct : 0;

  // ===== LOGIN SCREEN =====
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <Corners />
          <div className="login-label">— SIGN IN REQUIRED —</div>
          <h1 className="login-title">{config.question}</h1>
          <div className="login-preview">
            <div
              className="login-preview-side left"
              style={{ backgroundImage: `url('${config.left.imageUrl}')` }}
            >
              <span>{config.left.name}</span>
            </div>
            <div className="login-vs">VS</div>
            <div
              className="login-preview-side right"
              style={{ backgroundImage: `url('${config.right.imageUrl}')` }}
            >
              <span>{config.right.name}</span>
            </div>
          </div>
          <p className="login-text">
            ต้องยืนยันตัวด้วย Discord ก่อนโหวต<br />
            <span className="muted">เพื่อป้องกันการโหวตซ้ำ</span>
          </p>
          <a href="/api/auth/login" className="discord-btn">
            <DiscordIcon /> เข้าสู่ระบบด้วย Discord
          </a>
        </div>
      </div>
    );
  }

  // ===== MAIN VOTE SCREEN =====
  return (
    <>
      <div className="container">
        <header className="main-header">
          <div className="logo">VOTE<span>/</span>BINARY <span>—</span> v1.0</div>
          <div className="user-info">
            <div className="dot"></div>
            <span className="username">{user.username}</span>
            <button onClick={handleLogout} className="logout-btn">LOGOUT</button>
          </div>
        </header>

        <section className="question-section">
          <div className="question-label">— THE QUESTION —</div>
          <h1 className="question">{config.question}</h1>
          <div className="vs-text">CHOOSE ONE</div>
        </section>

        <main className="vote-grid">
          <div
            className={`vote-side ${myVote ? (myVote === 'left' ? 'voted-choice' : 'not-chosen') : ''}`}
            data-side="left"
            onClick={() => !myVote && setPendingChoice('left')}
          >
            <div
              className="vote-image"
              style={{ backgroundImage: `url('${config.left.imageUrl}')` }}
            ></div>
            <Corners />
            <div className="vote-content">
              <div className="arrow">←</div>
              <div className="vote-label">LEFT</div>
              <div className="vote-name">{config.left.name}</div>
              {myVote && (
                <div className="vote-stat">
                  <div className="bar">
                    <div className="bar-fill left" style={{ width: leftPct + '%' }}></div>
                  </div>
                  <div className="vote-stat-text">{leftPct}% · {counts.left} votes</div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`vote-side ${myVote ? (myVote === 'right' ? 'voted-choice' : 'not-chosen') : ''}`}
            data-side="right"
            onClick={() => !myVote && setPendingChoice('right')}
          >
            <div
              className="vote-image"
              style={{ backgroundImage: `url('${config.right.imageUrl}')` }}
            ></div>
            <Corners />
            <div className="vote-content">
              <div className="vote-label">RIGHT</div>
              <div className="vote-name">{config.right.name}</div>
              <div className="arrow">→</div>
              {myVote && (
                <div className="vote-stat">
                  <div className="bar">
                    <div className="bar-fill right" style={{ width: rightPct + '%' }}></div>
                  </div>
                  <div className="vote-stat-text">{rightPct}% · {counts.right} votes</div>
                </div>
              )}
            </div>
          </div>
        </main>

        {myVote && (
          <section className="footer-bar">
            <div className="footer-text">
              YOU VOTED <strong>{config[myVote].name}</strong> · TOTAL {total} VOTES
            </div>
            <button
              onClick={handleReset}
              className="reset-btn"
              disabled={submitting}
            >
              เปลี่ยนใจ / รีเซ็ตโหวต
            </button>
          </section>
        )}
      </div>

      {pendingChoice && (
        <div className="modal-overlay" onClick={() => setPendingChoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <Corners />
            <div
              className={`modal-image ${pendingChoice}`}
              style={{ backgroundImage: `url('${config[pendingChoice].imageUrl}')` }}
            ></div>
            <div className="modal-label">— CONFIRM YOUR VOTE —</div>
            <div className={`modal-choice ${pendingChoice}`}>
              {config[pendingChoice].name}
            </div>
            <div className="modal-warning">
              คุณกำลังจะโหวต <strong>{config[pendingChoice].name}</strong><br />
              <span className="muted">เปลี่ยนใจได้ภายหลังด้วยปุ่มรีเซ็ต</span>
            </div>
            <div className="modal-buttons">
              <button className="btn" onClick={() => setPendingChoice(null)}>
                ยกเลิก
              </button>
              <button
                className={`btn btn-confirm ${pendingChoice}`}
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? '...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Corners() {
  return (
    <>
      <div className="corner tl"></div>
      <div className="corner tr"></div>
      <div className="corner bl"></div>
      <div className="corner br"></div>
    </>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

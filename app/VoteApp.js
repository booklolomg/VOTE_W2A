'use client';

import { useState, useEffect } from 'react';

export default function VoteApp({ config, initial }) {
  const [user, setUser] = useState(initial.user);
  const [myVote, setMyVote] = useState(initial.myVote);
  const [counts, setCounts] = useState(initial.counts);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // poll for updated counts every 5s when user has voted
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

  // ESC to cancel modal
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
      <>
        <Styles />
        <div className="login-screen">
          <div className="login-card">
            <Corners />
            <div className="login-label">— SIGN IN REQUIRED —</div>
            <h1 className="login-title">{config.question}</h1>
            <div className="login-preview">
              <div className="login-preview-side left" style={{ backgroundImage: `url('${config.left.imageUrl}')` }}>
                <span>{config.left.name}</span>
              </div>
              <div className="login-vs">VS</div>
              <div className="login-preview-side right" style={{ backgroundImage: `url('${config.right.imageUrl}')` }}>
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
      </>
    );
  }

  // ===== MAIN VOTE SCREEN =====
  return (
    <>
      <Styles />
      <div className="container">
        <header>
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
            <div className="vote-image" style={{ backgroundImage: `url('${config.left.imageUrl}')` }}></div>
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
            <div className="vote-image" style={{ backgroundImage: `url('${config.right.imageUrl}')` }}></div>
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
            <button onClick={handleReset} className="reset-btn" disabled={submitting}>
              เปลี่ยนใจ / รีเซ็ตโหวต
            </button>
          </section>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {pendingChoice && (
        <div className="modal-overlay" onClick={() => setPendingChoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <Corners />
            <div
              className={`modal-image ${pendingChoice}`}
              style={{ backgroundImage: `url('${config[pendingChoice].imageUrl}')` }}
            ></div>
            <div className="modal-label">— CONFIRM YOUR VOTE —</div>
            <div className={`modal-choice ${pendingChoice}`}>{config[pendingChoice].name}</div>
            <div className="modal-warning">
              คุณกำลังจะโหวต <strong>{config[pendingChoice].name}</strong><br />
              <span className="muted">เปลี่ยนใจได้ภายหลังด้วยปุ่มรีเซ็ต</span>
            </div>
            <div className="modal-buttons">
              <button className="btn" onClick={() => setPendingChoice(null)}>ยกเลิก</button>
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

function Styles() {
  return (
    <style jsx global>{`
      :root {
        --bg: #0a0a0a;
        --left-color: #ff3d3d;
        --right-color: #3d8bff;
        --discord: #5865f2;
        --text: #f5f5f0;
        --muted: #8a8a85;
        --border: #1f1f1f;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Sarabun', sans-serif;
        background: var(--bg);
        color: var(--text);
        min-height: 100vh;
        overflow-x: hidden;
      }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 100;
        opacity: 0.04;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }
      .muted { color: var(--muted); }

      /* LOGIN SCREEN */
      .login-screen {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .login-card {
        max-width: 480px;
        width: 100%;
        padding: 3rem 2rem;
        border: 1px solid var(--border);
        text-align: center;
        position: relative;
      }
      .login-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.3em;
        color: var(--muted);
        margin-bottom: 1.5rem;
      }
      .login-title {
        font-family: 'Bebas Neue', sans-serif;
        font-size: clamp(2rem, 5vw, 3rem);
        line-height: 1;
        margin-bottom: 2rem;
        letter-spacing: 0.02em;
      }
      .login-preview {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 0.8rem;
        align-items: center;
        margin-bottom: 2rem;
      }
      .login-preview-side {
        height: 100px;
        background-size: cover;
        background-position: center;
        position: relative;
        display: flex;
        align-items: end;
        justify-content: center;
        padding: 0.5rem;
        border: 1px solid var(--border);
      }
      .login-preview-side::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
      }
      .login-preview-side.left { border-color: var(--left-color); }
      .login-preview-side.right { border-color: var(--right-color); }
      .login-preview-side span {
        position: relative;
        font-family: 'Bebas Neue', sans-serif;
        font-size: 1.2rem;
        letter-spacing: 0.05em;
      }
      .login-vs {
        font-family: 'Bebas Neue', sans-serif;
        color: var(--muted);
        font-size: 1rem;
      }
      .login-text {
        font-size: 0.9rem;
        margin-bottom: 2rem;
        line-height: 1.6;
      }
      .discord-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        padding: 1rem 2rem;
        background: var(--discord);
        color: white;
        text-decoration: none;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.85rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        border: 1px solid var(--discord);
        transition: all 0.2s;
      }
      .discord-btn:hover {
        background: transparent;
        color: var(--discord);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(88, 101, 242, 0.3);
      }

      /* MAIN APP */
      .container { min-height: 100vh; display: flex; flex-direction: column; }
      header {
        padding: 1.5rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border);
        flex-wrap: wrap;
        gap: 1rem;
      }
      .logo {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        letter-spacing: 0.2em;
        color: var(--muted);
      }
      .logo span { color: var(--text); }
      .user-info {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 8px #4ade80;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .username { color: var(--text); }
      .logout-btn {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--muted);
        padding: 0.4rem 0.8rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.15em;
        cursor: pointer;
        transition: all 0.2s;
      }
      .logout-btn:hover { color: var(--text); border-color: var(--text); }

      .question-section {
        text-align: center;
        padding: 2.5rem 2rem 1.5rem;
      }
      .question-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.3em;
        color: var(--muted);
        margin-bottom: 1rem;
      }
      .question {
        font-family: 'Bebas Neue', sans-serif;
        font-size: clamp(2.2rem, 5vw, 4rem);
        line-height: 1;
        letter-spacing: 0.02em;
        margin-bottom: 0.5rem;
      }
      .vs-text {
        font-family: 'Bebas Neue', sans-serif;
        font-size: clamp(1rem, 1.8vw, 1.3rem);
        color: var(--muted);
        letter-spacing: 0.4em;
      }

      .vote-grid {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--border);
        min-height: 55vh;
        position: relative;
      }
      .vote-grid::after {
        content: 'VS';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Bebas Neue', sans-serif;
        font-size: 2rem;
        color: var(--text);
        background: var(--bg);
        border: 1px solid var(--border);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        letter-spacing: 0.05em;
      }
      .vote-side {
        background: var(--bg);
        position: relative;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 2rem 1.5rem;
        user-select: none;
      }
      .vote-image {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.5;
        transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        filter: grayscale(0.3) contrast(1.05);
      }
      .vote-side:hover .vote-image {
        opacity: 0.85;
        transform: scale(1.05);
        filter: grayscale(0) contrast(1.1);
      }
      .vote-side::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        transition: opacity 0.4s;
      }
      .vote-side[data-side="left"]::before {
        background: linear-gradient(135deg, rgba(255, 61, 61, 0.4) 0%, rgba(10, 10, 10, 0.7) 100%);
      }
      .vote-side[data-side="right"]::before {
        background: linear-gradient(225deg, rgba(61, 139, 255, 0.4) 0%, rgba(10, 10, 10, 0.7) 100%);
      }
      .vote-side:hover::before { opacity: 0.7; }
      .vote-side:hover { transform: scale(0.99); }
      .vote-content {
        position: relative;
        z-index: 2;
        text-align: center;
        width: 100%;
      }
      .vote-label {
        font-family: 'Bebas Neue', sans-serif;
        font-size: clamp(3rem, 9vw, 6rem);
        line-height: 0.85;
        letter-spacing: -0.02em;
        transition: all 0.4s;
        text-shadow: 0 4px 30px rgba(0, 0, 0, 0.8);
      }
      .vote-side[data-side="left"] .vote-label { color: var(--left-color); }
      .vote-side[data-side="right"] .vote-label { color: var(--right-color); }
      .vote-side:hover .vote-label {
        text-shadow: 0 0 40px currentColor, 0 4px 30px rgba(0,0,0,0.8);
      }
      .vote-name {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.9rem;
        letter-spacing: 0.3em;
        color: var(--text);
        margin-top: 0.8rem;
        text-transform: uppercase;
        text-shadow: 0 2px 10px rgba(0,0,0,0.8);
      }
      .arrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.5rem;
        margin-top: 0.5rem;
        color: var(--text);
        opacity: 0.6;
        transition: all 0.4s;
      }
      .vote-side:hover .arrow { opacity: 1; }

      .vote-stat {
        margin-top: 1.2rem;
        padding: 0 1rem;
      }
      .bar {
        height: 6px;
        background: rgba(255,255,255,0.1);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .bar-fill.left { background: var(--left-color); box-shadow: 0 0 12px var(--left-color); }
      .bar-fill.right { background: var(--right-color); box-shadow: 0 0 12px var(--right-color); }
      .vote-stat-text {
        margin-top: 0.5rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        color: var(--text);
        text-shadow: 0 2px 10px rgba(0,0,0,0.8);
      }

      .corner {
        position: absolute;
        width: 20px;
        height: 20px;
        border-color: var(--text);
        border-style: solid;
        border-width: 0;
        opacity: 0.5;
        z-index: 3;
      }
      .corner.tl { top: 1rem; left: 1rem; border-top-width: 1px; border-left-width: 1px; }
      .corner.tr { top: 1rem; right: 1rem; border-top-width: 1px; border-right-width: 1px; }
      .corner.bl { bottom: 1rem; left: 1rem; border-bottom-width: 1px; border-left-width: 1px; }
      .corner.br { bottom: 1rem; right: 1rem; border-bottom-width: 1px; border-right-width: 1px; }

      .vote-side.voted-choice .vote-image { opacity: 1; transform: scale(1.05); filter: none; }
      .vote-side.voted-choice .vote-label { text-shadow: 0 0 60px currentColor, 0 4px 30px rgba(0,0,0,0.8); }
      .vote-side.not-chosen { opacity: 0.4; pointer-events: none; }

      .footer-bar {
        padding: 1.2rem 2rem;
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .footer-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        color: var(--muted);
        letter-spacing: 0.15em;
      }
      .footer-text strong { color: var(--text); }
      .reset-btn {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--muted);
        padding: 0.6rem 1.2rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.15em;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: uppercase;
      }
      .reset-btn:hover { color: var(--text); border-color: var(--text); }
      .reset-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      /* MODAL */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        padding: 1rem;
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .modal {
        background: var(--bg);
        border: 1px solid var(--border);
        padding: 2.5rem 2rem;
        max-width: 420px;
        width: 100%;
        text-align: center;
        position: relative;
        animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .modal .corner { opacity: 0.6; }
      .modal-image {
        width: 120px;
        height: 120px;
        margin: 0 auto 1.2rem;
        background-size: cover;
        background-position: center;
        border: 2px solid var(--text);
      }
      .modal-image.left { border-color: var(--left-color); box-shadow: 0 0 40px var(--left-color); }
      .modal-image.right { border-color: var(--right-color); box-shadow: 0 0 40px var(--right-color); }
      .modal-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.3em;
        color: var(--muted);
        margin-bottom: 1rem;
      }
      .modal-choice {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 3.5rem;
        line-height: 0.9;
        margin-bottom: 0.3rem;
        letter-spacing: 0.02em;
      }
      .modal-choice.left { color: var(--left-color); }
      .modal-choice.right { color: var(--right-color); }
      .modal-warning {
        font-size: 0.85rem;
        color: var(--text);
        margin-bottom: 2rem;
        line-height: 1.5;
      }
      .modal-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
      }
      .btn {
        padding: 1rem;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        letter-spacing: 0.2em;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: uppercase;
      }
      .btn:hover { background: var(--text); color: var(--bg); }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-confirm {
        border-color: var(--text);
        background: var(--text);
        color: var(--bg);
      }
      .btn-confirm.left:hover { background: var(--left-color); border-color: var(--left-color); color: var(--bg); }
      .btn-confirm.right:hover { background: var(--right-color); border-color: var(--right-color); color: var(--bg); }

      @media (max-width: 640px) {
        .vote-grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
        .question-section { padding: 1.5rem 1rem 1rem; }
        header { padding: 1rem; }
        .modal-choice { font-size: 2.8rem; }
        .modal-image { width: 100px; height: 100px; }
        .footer-bar { padding: 1rem; }
      }
    `}</style>
  );
}

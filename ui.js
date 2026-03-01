// ===== ui.js =====
// Rendering & DOM interactions

const UI = (() => {

  function formatDuration(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function formatTimeOfDay(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateNice(key) {
    const [y, m, d] = key.split('-');
    return new Date(y, m - 1, d).toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  // --- Render today's stats ---
  function renderStats() {
    const sessions = Data.getTodaySessions();
    const totalSecs = sessions.reduce((a, s) => a + s.duration, 0);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);

    document.getElementById('totalTime').textContent = `${h}h ${m}m`;
    document.getElementById('sessionCount').textContent = sessions.length;

    if (sessions.length > 0) {
      const avg = Math.round(totalSecs / sessions.length);
      document.getElementById('avgSession').textContent = formatDuration(avg);
    } else {
      document.getElementById('avgSession').textContent = '—';
    }
  }

  // --- Render today's sessions ---
  function renderSessions() {
    const sessions = Data.getTodaySessions();
    const list = document.getElementById('sessionsList');

    if (sessions.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <p>No sessions yet today</p>
        </div>`;
      return;
    }

    list.innerHTML = sessions.map((s, i) => `
      <div class="session-item">
        <div>
          <div class="session-num">#${i + 1}</div>
          <div class="session-range">${formatTimeOfDay(s.startedAt)} → ${formatTimeOfDay(s.endedAt)}</div>
        </div>
        <div class="session-right">
          <span class="session-dur">${formatDuration(s.duration)}</span>
          <button class="del-btn" onclick="UI.deleteSession(${i})" title="Delete">✕</button>
        </div>
      </div>
    `).reverse().join('');
  }

  function deleteSession(index) {
    if (!confirm('Delete this session?')) return;
    Data.deleteSession(index);
    renderAll();
    toast('Session deleted');
    Data.pushToCloud();
  }

  // --- Render history ---
  function renderHistory() {
    const data = Data.getLocal();
    const today = Data.todayKey();
    const days = Object.keys(data).filter(k => k !== today).sort().reverse();

    const container = document.getElementById('historyList');
    if (days.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No past days yet</p></div>`;
      return;
    }

    container.innerHTML = days.map(day => {
      const sessions = data[day];
      const total = sessions.reduce((a, s) => a + s.duration, 0);
      return `
        <div class="history-day">
          <div>
            <div class="history-date">${formatDateNice(day)}</div>
            <div class="history-meta">${sessions.length} session${sessions.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="history-total">${formatDuration(total)}</div>
        </div>`;
    }).join('');
  }

  // --- Render everything ---
  function renderAll() {
    renderStats();
    renderSessions();
    renderHistory();
  }

  // --- Toggles ---
  function toggleHistory() {
    const sec = document.getElementById('historySection');
    const btn = document.getElementById('historyToggle');
    sec.classList.toggle('hidden');
    btn.classList.toggle('open');
  }

  function toggleSettings() {
    const sec = document.getElementById('settingsSection');
    const btn = document.getElementById('settingsToggle');
    sec.classList.toggle('hidden');
    btn.classList.toggle('open');
  }

  // --- Toast ---
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
  }

  return {
    renderAll, renderStats, renderSessions, renderHistory,
    deleteSession, toggleHistory, toggleSettings, toast,
    formatDuration
  };
})();

// ===== ui.js =====
// DOM rendering & interactions

var UI = (function () {

  function formatDuration(secs) {
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  }

  function formatTimeOfDay(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateNice(key) {
    var parts = key.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  function renderStats() {
    var sessions = Data.getTodaySessions();
    var totalSecs = 0;
    for (var i = 0; i < sessions.length; i++) totalSecs += sessions[i].duration;
    var h = Math.floor(totalSecs / 3600);
    var m = Math.floor((totalSecs % 3600) / 60);

    document.getElementById('totalTime').textContent = h + 'h ' + m + 'm';
    document.getElementById('sessionCount').textContent = sessions.length;

    if (sessions.length > 0) {
      var avg = Math.round(totalSecs / sessions.length);
      document.getElementById('avgSession').textContent = formatDuration(avg);
    } else {
      document.getElementById('avgSession').textContent = '—';
    }
  }

  function renderSessions() {
    var sessions = Data.getTodaySessions();
    var list = document.getElementById('sessionsList');

    if (sessions.length === 0) {
      list.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">📚</div>' +
        '<p>No sessions yet today</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = sessions.length - 1; i >= 0; i--) {
      var s = sessions[i];
      html +=
        '<div class="session-item">' +
        '  <div>' +
        '    <div class="session-num">#' + (i + 1) + '</div>' +
        '    <div class="session-range">' + formatTimeOfDay(s.startedAt) + ' → ' + formatTimeOfDay(s.endedAt) + '</div>' +
        '  </div>' +
        '  <div class="session-right">' +
        '    <span class="session-dur">' + formatDuration(s.duration) + '</span>' +
        '    <button class="del-btn" onclick="UI.deleteSession(' + i + ')" title="Delete">✕</button>' +
        '  </div>' +
        '</div>';
    }
    list.innerHTML = html;
  }

  function deleteSession(index) {
    if (!confirm('Delete this session?')) return;
    Data.deleteSession(index);
    renderAll();
    toast('Session deleted');
    Data.pushToCloud();
  }

  function renderHistory() {
    var data = Data.getLocal();
    var today = Data.todayKey();
    var days = Object.keys(data).filter(function (k) { return k !== today; }).sort().reverse();

    var container = document.getElementById('historyList');
    if (days.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No past days yet</p></div>';
      return;
    }

    var html = '';
    for (var i = 0; i < days.length; i++) {
      var day = days[i];
      var sessions = data[day];
      var total = 0;
      for (var j = 0; j < sessions.length; j++) total += sessions[j].duration;
      html +=
        '<div class="history-day">' +
        '  <div>' +
        '    <div class="history-date">' + formatDateNice(day) + '</div>' +
        '    <div class="history-meta">' + sessions.length + ' session' + (sessions.length !== 1 ? 's' : '') + '</div>' +
        '  </div>' +
        '  <div class="history-total">' + formatDuration(total) + '</div>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  function renderAll() {
    renderStats();
    renderSessions();
    renderHistory();
  }

  function toggleHistory() {
    var sec = document.getElementById('historySection');
    var btn = document.getElementById('historyToggle');
    sec.classList.toggle('hidden');
    btn.classList.toggle('open');
  }

  function toggleSettings() {
    var sec = document.getElementById('settingsSection');
    var btn = document.getElementById('settingsToggle');
    sec.classList.toggle('hidden');
    btn.classList.toggle('open');
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  return {
    renderAll: renderAll,
    deleteSession: deleteSession,
    toggleHistory: toggleHistory,
    toggleSettings: toggleSettings,
    toast: toast,
    formatDuration: formatDuration
  };
})();

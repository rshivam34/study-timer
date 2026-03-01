// ===== timer.js =====
// Core timer logic

const Timer = (() => {
  let interval = null;
  let startTime = null;
  let elapsed = 0;
  let running = false;

  function start() {
    running = true;
    startTime = Date.now() - (elapsed * 1000);
    interval = setInterval(tick, 200);

    document.getElementById('timerCard').classList.add('running');
    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');
    document.getElementById('discardBtn').classList.remove('hidden');
    document.getElementById('timerLabel').textContent = 'Studying...';
    document.title = '⏱ Studying... | Study Timer';
  }

  function stop() {
    if (!running) return;
    clearInterval(interval);
    running = false;

    if (elapsed >= 1) {
      const now = new Date();
      const began = new Date(now.getTime() - elapsed * 1000);
      Data.addSession({
        duration: elapsed,
        startedAt: began.toISOString(),
        endedAt: now.toISOString()
      });
      UI.toast('Session saved ✓');

      // Push to cloud in background
      Data.pushToCloud().then(() => {
        App.updateSyncUI('synced');
      }).catch(() => {
        App.updateSyncUI('error');
      });
    }

    reset();
    UI.renderAll();
  }

  function discard() {
    if (running && elapsed > 5) {
      if (!confirm('Discard this session?')) return;
    }
    clearInterval(interval);
    running = false;
    reset();
  }

  function reset() {
    elapsed = 0;
    document.getElementById('timerCard').classList.remove('running');
    document.getElementById('timerDisplay').textContent = '00:00:00';
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('discardBtn').classList.add('hidden');
    document.getElementById('timerLabel').textContent = 'Ready to focus';
    document.title = 'Study Timer';
  }

  function tick() {
    elapsed = Math.floor((Date.now() - startTime) / 1000);
    const display = formatTime(elapsed);
    document.getElementById('timerDisplay').textContent = display;
    document.title = `⏱ ${display} | Studying`;
  }

  function formatTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function isRunning() {
    return running;
  }

  return { start, stop, discard, reset, formatTime, isRunning };
})();

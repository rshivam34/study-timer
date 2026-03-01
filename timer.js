// ===== timer.js =====
// Core stopwatch logic

var Timer = (function () {
  var interval = null;
  var startTime = null;
  var elapsed = 0;
  var running = false;

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
      var now = new Date();
      var began = new Date(now.getTime() - elapsed * 1000);
      Data.addSession({
        duration: elapsed,
        startedAt: began.toISOString(),
        endedAt: now.toISOString()
      });
      UI.toast('Session saved ✓');

      // Push to cloud in background
      Data.pushToCloud()
        .then(function () { App.updateSyncUI('synced'); })
        .catch(function () { App.updateSyncUI('error'); });
    }

    resetUI();
    UI.renderAll();
  }

  function discard() {
    if (running && elapsed > 5) {
      if (!confirm('Discard this session?')) return;
    }
    clearInterval(interval);
    running = false;
    resetUI();
  }

  function resetUI() {
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
    var display = formatTime(elapsed);
    document.getElementById('timerDisplay').textContent = display;
    document.title = '⏱ ' + display + ' | Studying';
  }

  function formatTime(secs) {
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    return String(h).padStart(2, '0') + ':' +
           String(m).padStart(2, '0') + ':' +
           String(s).padStart(2, '0');
  }

  function isRunning() {
    return running;
  }

  return {
    start: start,
    stop: stop,
    discard: discard,
    formatTime: formatTime,
    isRunning: isRunning
  };
})();

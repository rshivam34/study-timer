// ===== app.js =====
// Initialization & sync orchestration

var App = (function () {

  function init() {
    // Show today's date
    document.getElementById('todayDate').textContent = new Date().toLocaleDateString([], {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Render local data immediately
    UI.renderAll();

    // Auto-connect to GitHub Gist
    if (Data.isCloudEnabled()) {
      // Already has gist ID cached — sync
      updateSyncUI('syncing');
      Data.syncWithCloud()
        .then(function () { UI.renderAll(); updateSyncUI('synced'); })
        .catch(function () { UI.renderAll(); updateSyncUI('error'); });
    } else {
      // First time on this device — find or create gist
      updateSyncUI('syncing');
      Data.autoConnect()
        .then(function () { UI.renderAll(); updateSyncUI('synced'); })
        .catch(function (e) {
          console.error('Auto-connect failed:', e);
          UI.renderAll();
          updateSyncUI('error');
        });
    }

    // Update gist status in settings
    updateGistStatus();

    // Warn before tab close if timer running
    window.addEventListener('beforeunload', function (e) {
      if (Timer.isRunning()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Auto-sync every 5 minutes
    setInterval(function () {
      if (Data.isCloudEnabled() && !Timer.isRunning()) {
        Data.syncWithCloud()
          .then(function () { updateSyncUI('synced'); })
          .catch(function () { updateSyncUI('error'); });
      }
    }, 5 * 60 * 1000);
  }

  function updateSyncUI(state) {
    var dot = document.getElementById('syncDot');
    var text = document.getElementById('syncText');
    var btn = document.getElementById('syncBtn');

    dot.className = 'sync-dot';
    btn.classList.remove('spinning');

    if (state === 'synced') {
      dot.classList.add('connected');
      text.textContent = 'Synced with GitHub';
    } else if (state === 'syncing') {
      dot.classList.add('syncing');
      text.textContent = 'Syncing...';
      btn.classList.add('spinning');
    } else if (state === 'error') {
      dot.classList.add('error');
      text.textContent = 'Sync error';
    } else {
      text.textContent = 'Local only';
    }
  }

  function updateGistStatus() {
    var status = document.getElementById('gistStatus');
    if (Data.getGistId()) {
      status.textContent = 'Connected — Gist: ' + Data.getGistId().slice(0, 8) + '...';
    } else {
      status.textContent = 'Connecting...';
    }
  }

  function manualSync() {
    updateSyncUI('syncing');

    var syncPromise;
    if (Data.isCloudEnabled()) {
      syncPromise = Data.syncWithCloud();
    } else {
      syncPromise = Data.autoConnect();
    }

    syncPromise
      .then(function () {
        UI.renderAll();
        updateSyncUI('synced');
        updateGistStatus();
        UI.toast('Synced ✓');
      })
      .catch(function () {
        updateSyncUI('error');
        UI.toast('Sync failed — check connection');
      });
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    manualSync: manualSync,
    updateSyncUI: updateSyncUI
  };
})();

// ===== app.js =====
// App initialization, setup flow, sync control

const App = (() => {

  function init() {
    // Show today's date
    document.getElementById('todayDate').textContent = new Date().toLocaleDateString([], {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Always go straight to main app
    showMainApp();

    // Auto-connect to GitHub Gist
    if (Data.isCloudEnabled()) {
      // Already has gist ID — just sync
      updateSyncUI('syncing');
      Data.syncWithCloud()
        .then(() => { UI.renderAll(); updateSyncUI('synced'); })
        .catch(() => { UI.renderAll(); updateSyncUI('error'); });
    } else if (Data.getToken()) {
      // Has token but no gist ID — auto-find or create gist
      updateSyncUI('syncing');
      autoConnectGist();
    } else {
      updateSyncUI('local');
    }

    // Warn before tab close if timer running
    window.addEventListener('beforeunload', (e) => {
      if (Timer.isRunning()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Auto-sync every 5 minutes if cloud enabled
    setInterval(() => {
      if (Data.isCloudEnabled() && !Timer.isRunning()) {
        Data.syncWithCloud()
          .then(() => updateSyncUI('synced'))
          .catch(() => updateSyncUI('error'));
      }
    }, 5 * 60 * 1000);
  }

  // Auto-find existing gist or create a new one
  async function autoConnectGist() {
    try {
      const token = Data.getToken();
      const existingGistId = await Data.validateToken(token);

      if (existingGistId) {
        Data.setGistId(existingGistId);
        await Data.syncWithCloud();
      } else {
        const newId = await Data.createGist(token);
        Data.setGistId(newId);
      }

      UI.renderAll();
      updateSyncUI('synced');
    } catch (e) {
      console.error('Auto-connect failed:', e);
      UI.renderAll();
      updateSyncUI('error');
    }
  }

  function showSetupScreen() {
    document.getElementById('setupScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
  }

  function showMainApp() {
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    UI.renderAll();
    updateGistStatus();
  }

  // --- Connect Gist ---
  async function connectGist() {
    const token = document.getElementById('tokenInput').value.trim();
    const hint = document.getElementById('setupHint');

    if (!token) {
      hint.textContent = 'Please enter a token.';
      return;
    }

    hint.textContent = '';
    hint.style.color = 'var(--accent)';
    hint.textContent = 'Validating...';

    try {
      // Validate token & check for existing gist
      const existingGistId = await Data.validateToken(token);
      Data.setToken(token);

      if (existingGistId) {
        // Found existing gist — sync
        Data.setGistId(existingGistId);
        hint.textContent = 'Found existing data, syncing...';

        await Data.syncWithCloud();
        hint.style.color = 'var(--green)';
        hint.textContent = 'Connected & synced! ✓';
      } else {
        // Create new gist
        hint.textContent = 'Creating gist...';
        const newId = await Data.createGist(token);
        Data.setGistId(newId);
        hint.style.color = 'var(--green)';
        hint.textContent = 'Gist created & connected! ✓';
      }

      setTimeout(() => showMainApp(), 800);
      updateSyncUI('synced');

    } catch (e) {
      hint.style.color = 'var(--red)';
      hint.textContent = 'Invalid token or API error. Check the token and try again.';
      console.error(e);
    }
  }

  function skipSetup() {
    showMainApp();
    updateSyncUI('local');
  }

  function showSetup() {
    showSetupScreen();
  }

  // --- Sync UI ---
  function updateSyncUI(state) {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncText');
    const btn = document.getElementById('syncBtn');

    dot.className = 'sync-dot';
    btn.classList.remove('spinning');

    switch (state) {
      case 'synced':
        dot.classList.add('connected');
        text.textContent = 'Synced with GitHub';
        break;
      case 'syncing':
        dot.classList.add('syncing');
        text.textContent = 'Syncing...';
        btn.classList.add('spinning');
        break;
      case 'error':
        dot.classList.add('error');
        text.textContent = 'Sync error';
        break;
      case 'local':
      default:
        text.textContent = 'Local only';
        break;
    }
  }

  function updateGistStatus() {
    const status = document.getElementById('gistStatus');
    const actionBtn = document.getElementById('gistActionBtn');

    if (Data.isCloudEnabled()) {
      status.textContent = `Connected — Gist ID: ${Data.getGistId().slice(0, 8)}...`;
      actionBtn.textContent = 'Disconnect';
      actionBtn.onclick = () => {
        if (confirm('Disconnect GitHub sync? Local data will be kept.')) {
          Data.disconnect();
          updateGistStatus();
          updateSyncUI('local');
          UI.toast('Disconnected from GitHub');
        }
      };
    } else {
      status.textContent = 'Not connected';
      actionBtn.textContent = 'Connect';
      actionBtn.onclick = () => showSetup();
    }
  }

  async function manualSync() {
    if (!Data.isCloudEnabled()) {
      UI.toast('Connect GitHub first');
      return;
    }

    updateSyncUI('syncing');
    try {
      await Data.syncWithCloud();
      UI.renderAll();
      updateSyncUI('synced');
      UI.toast('Synced ✓');
    } catch {
      updateSyncUI('error');
      UI.toast('Sync failed');
    }
  }

  // Start the app
  document.addEventListener('DOMContentLoaded', init);

  return {
    connectGist, skipSetup, showSetup, manualSync, updateSyncUI
  };
})();

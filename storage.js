// ===== storage.js =====
// Handles local storage + GitHub Gist cloud sync

const Data = (() => {
  const STORAGE_KEY = 'study_timer_data';
  const TOKEN_KEY = 'study_timer_gh_token';
  const GIST_ID_KEY = 'study_timer_gist_id';
  const GIST_FILENAME = 'study_timer_data.json';

  // --- Local Storage ---
  function getLocal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }

  function saveLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function getGistId() {
    return localStorage.getItem(GIST_ID_KEY) || '';
  }

  function setGistId(id) {
    localStorage.setItem(GIST_ID_KEY, id);
  }

  function isCloudEnabled() {
    return !!(getToken() && getGistId());
  }

  // --- Today helpers ---
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getTodaySessions() {
    return getLocal()[todayKey()] || [];
  }

  function addSession(session) {
    const data = getLocal();
    const key = todayKey();
    if (!data[key]) data[key] = [];
    data[key].push(session);
    saveLocal(data);
  }

  function deleteSession(index) {
    const data = getLocal();
    const key = todayKey();
    if (data[key]) {
      data[key].splice(index, 1);
      if (data[key].length === 0) delete data[key];
      saveLocal(data);
    }
  }

  // --- Merge logic (for import & cloud sync) ---
  function mergeData(existing, incoming) {
    const merged = { ...existing };
    for (const key of Object.keys(incoming)) {
      if (!merged[key]) {
        merged[key] = incoming[key];
      } else {
        const existingEnds = new Set(merged[key].map(s => s.endedAt));
        for (const sess of incoming[key]) {
          if (!existingEnds.has(sess.endedAt)) {
            merged[key].push(sess);
          }
        }
      }
    }
    return merged;
  }

  // --- GitHub Gist API ---
  async function createGist(token) {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        description: 'Study Timer Data - Auto Synced',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(getLocal(), null, 2) || '{}'
          }
        }
      })
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const gist = await res.json();
    return gist.id;
  }

  async function fetchGist() {
    const token = getToken();
    const gistId = getGistId();
    if (!token || !gistId) return null;

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    if (!res.ok) throw new Error(`Fetch gist error: ${res.status}`);
    const gist = await res.json();
    const content = gist.files?.[GIST_FILENAME]?.content;
    return content ? JSON.parse(content) : {};
  }

  async function updateGist(data) {
    const token = getToken();
    const gistId = getGistId();
    if (!token || !gistId) return;

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    });
    if (!res.ok) throw new Error(`Update gist error: ${res.status}`);
  }

  // Full sync: pull from gist → merge → push back
  async function syncWithCloud() {
    if (!isCloudEnabled()) return false;
    try {
      const remote = await fetchGist();
      const local = getLocal();
      const merged = mergeData(local, remote || {});
      saveLocal(merged);
      await updateGist(merged);
      return true;
    } catch (e) {
      console.error('Sync error:', e);
      throw e;
    }
  }

  // Push only (after adding a session)
  async function pushToCloud() {
    if (!isCloudEnabled()) return;
    try {
      await updateGist(getLocal());
    } catch (e) {
      console.error('Push error:', e);
    }
  }

  // --- Validate token by listing gists ---
  async function validateToken(token) {
    const res = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    if (!res.ok) throw new Error('Invalid token');

    // Check if we already have a study timer gist
    const gists = await res.json();
    const existing = gists.find(g => g.files && g.files[GIST_FILENAME]);
    return existing ? existing.id : null;
  }

  // --- Export / Import ---
  function exportJSON() {
    const data = getLocal();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-timer-data-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Data exported ✓');
  }

  function triggerImport() {
    document.getElementById('fileInput').click();
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const imported = JSON.parse(ev.target.result);
        const merged = mergeData(getLocal(), imported);
        saveLocal(merged);
        UI.renderAll();
        UI.toast('Imported successfully ✓');
        if (isCloudEnabled()) pushToCloud();
      } catch {
        UI.toast('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function clearAll() {
    if (!confirm('Delete ALL study data? This cannot be undone.')) return;
    if (!confirm('Are you really sure?')) return;
    localStorage.removeItem(STORAGE_KEY);
    UI.renderAll();
    UI.toast('All data cleared');
    if (isCloudEnabled()) pushToCloud();
  }

  function disconnect() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GIST_ID_KEY);
  }

  return {
    getLocal, saveLocal, todayKey, getTodaySessions, addSession, deleteSession,
    getToken, setToken, getGistId, setGistId, isCloudEnabled,
    createGist, validateToken, syncWithCloud, pushToCloud,
    exportJSON, triggerImport, handleImport, clearAll, disconnect, mergeData
  };
})();

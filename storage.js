// ===== storage.js =====
// Data layer: localStorage + GitHub Gist cloud sync

var Data = (function () {
  var STORAGE_KEY = 'study_timer_data';
  var GIST_ID_KEY = 'study_timer_gist_id';
  var GIST_FILENAME = 'study_timer_data.json';

  // ============================================================
  // YOUR GITHUB TOKEN (gist scope only)
  // Keep this repo PRIVATE so the token stays safe.
  // ============================================================
  var TOKEN = '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';

  // --- Local ---
  function getLocal() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getGistId() {
    return localStorage.getItem(GIST_ID_KEY) || '';
  }

  function setGistId(id) {
    localStorage.setItem(GIST_ID_KEY, id);
  }

  function isCloudEnabled() {
    return !!(TOKEN && getGistId());
  }

  // --- Today helpers ---
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function getTodaySessions() {
    return getLocal()[todayKey()] || [];
  }

  function addSession(session) {
    var data = getLocal();
    var key = todayKey();
    if (!data[key]) data[key] = [];
    data[key].push(session);
    saveLocal(data);
  }

  function deleteSession(index) {
    var data = getLocal();
    var key = todayKey();
    if (data[key]) {
      data[key].splice(index, 1);
      if (data[key].length === 0) delete data[key];
      saveLocal(data);
    }
  }

  // --- Merge (avoids duplicates by endedAt) ---
  function mergeData(existing, incoming) {
    var merged = JSON.parse(JSON.stringify(existing)); // deep copy
    var keys = Object.keys(incoming);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!merged[key]) {
        merged[key] = incoming[key];
      } else {
        var existingEnds = {};
        for (var j = 0; j < merged[key].length; j++) {
          existingEnds[merged[key][j].endedAt] = true;
        }
        for (var k = 0; k < incoming[key].length; k++) {
          if (!existingEnds[incoming[key][k].endedAt]) {
            merged[key].push(incoming[key][k]);
          }
        }
      }
    }
    return merged;
  }

  // --- GitHub Gist API ---
  function apiHeaders() {
    return {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json'
    };
  }

  function findExistingGist() {
    return fetch('https://api.github.com/gists', {
      headers: apiHeaders()
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Token invalid: ' + res.status);
      return res.json();
    })
    .then(function (gists) {
      for (var i = 0; i < gists.length; i++) {
        if (gists[i].files && gists[i].files[GIST_FILENAME]) {
          return gists[i].id;
        }
      }
      return null;
    });
  }

  function createGist() {
    var files = {};
    files[GIST_FILENAME] = { content: JSON.stringify(getLocal(), null, 2) || '{}' };
    return fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        description: 'Study Timer Data - Auto Synced',
        public: false,
        files: files
      })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Create gist failed: ' + res.status);
      return res.json();
    })
    .then(function (gist) {
      return gist.id;
    });
  }

  function fetchGist() {
    var gistId = getGistId();
    if (!gistId) return Promise.resolve(null);
    return fetch('https://api.github.com/gists/' + gistId, {
      headers: apiHeaders()
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Fetch gist failed: ' + res.status);
      return res.json();
    })
    .then(function (gist) {
      var content = gist.files && gist.files[GIST_FILENAME] && gist.files[GIST_FILENAME].content;
      return content ? JSON.parse(content) : {};
    });
  }

  function updateGist(data) {
    var gistId = getGistId();
    if (!gistId) return Promise.resolve();
    var files = {};
    files[GIST_FILENAME] = { content: JSON.stringify(data, null, 2) };
    return fetch('https://api.github.com/gists/' + gistId, {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ files: files })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Update gist failed: ' + res.status);
    });
  }

  // Full sync: pull → merge → push
  function syncWithCloud() {
    if (!isCloudEnabled()) return Promise.resolve(false);
    return fetchGist()
      .then(function (remote) {
        var local = getLocal();
        var merged = mergeData(local, remote || {});
        saveLocal(merged);
        return updateGist(merged);
      })
      .then(function () { return true; });
  }

  // Push only (after saving a session)
  function pushToCloud() {
    if (!isCloudEnabled()) return Promise.resolve();
    return updateGist(getLocal()).catch(function (e) {
      console.error('Push error:', e);
    });
  }

  // Auto-connect: find existing gist or create one
  function autoConnect() {
    return findExistingGist()
      .then(function (existingId) {
        if (existingId) {
          setGistId(existingId);
          return syncWithCloud();
        } else {
          return createGist().then(function (newId) {
            setGistId(newId);
            return true;
          });
        }
      });
  }

  // --- Export / Import ---
  function exportJSON() {
    var data = getLocal();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'study-timer-data-' + todayKey() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Data exported ✓');
  }

  function triggerImport() {
    document.getElementById('fileInput').click();
  }

  function handleImport(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var imported = JSON.parse(ev.target.result);
        var merged = mergeData(getLocal(), imported);
        saveLocal(merged);
        UI.renderAll();
        UI.toast('Imported successfully ✓');
        pushToCloud();
      } catch (err) {
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
    pushToCloud();
  }

  return {
    getLocal: getLocal,
    saveLocal: saveLocal,
    todayKey: todayKey,
    getTodaySessions: getTodaySessions,
    addSession: addSession,
    deleteSession: deleteSession,
    getGistId: getGistId,
    setGistId: setGistId,
    isCloudEnabled: isCloudEnabled,
    autoConnect: autoConnect,
    syncWithCloud: syncWithCloud,
    pushToCloud: pushToCloud,
    exportJSON: exportJSON,
    triggerImport: triggerImport,
    handleImport: handleImport,
    clearAll: clearAll
  };
})();

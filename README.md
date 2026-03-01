# ⏱ Study Timer

A minimal, distraction-free study timer that syncs your data across all devices via GitHub Gist.

## Features

- **Count-up timer** — Start when you study, stop when you're done
- **Daily tracking** — Records every session with timestamps
- **Daily totals** — See total study time, session count, and average session length
- **History** — View past days' study summaries
- **Cloud sync via GitHub Gist** — Access your data from any device (phone, PC, tablet)
- **Offline support** — Works without internet, syncs when reconnected
- **Export/Import** — Backup your data as JSON
- **Auto-sync** — Syncs every 5 minutes in the background

## Quick Setup

### 1. Deploy to GitHub Pages

1. Fork or clone this repo
2. Go to **Settings → Pages**
3. Set Source to **main branch** → Save
4. Your timer will be live at `https://yourusername.github.io/study-timer/`

### 2. Enable Cloud Sync (optional but recommended)

1. Go to [GitHub Settings → Personal Access Tokens → Generate New Token (classic)](https://github.com/settings/tokens/new?scopes=gist&description=Study+Timer+App)
2. Select **only** the `gist` scope
3. Generate and copy the token
4. Open your Study Timer and paste the token in the setup screen
5. Done! Your data now syncs to a private GitHub Gist

### Using on Multiple Devices

Just open the same GitHub Pages URL on any device and enter the same GitHub token. The app will find your existing Gist and sync all data automatically.

## File Structure

```
study-timer/
├── index.html          # Main HTML
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── storage.js      # Data layer + GitHub Gist API
│   ├── timer.js        # Timer logic
│   ├── ui.js           # DOM rendering
│   └── app.js          # App init + sync orchestration
└── README.md
```

## Privacy & Security

- Your GitHub token is stored **only in your browser's localStorage**
- Data is saved to a **private** GitHub Gist (only you can see it)
- No external servers, no analytics, no tracking
- The token only has `gist` permission — it cannot access your repos

## License

MIT — use it however you like.

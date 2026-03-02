# Study Timer - Project Instructions

## Hosting

- This website is hosted directly on **GitHub Pages** from the `main` branch
- All file paths must be **relative** (e.g., `css/base.css`, `js/app.js`, `./index.html`)
- Never use absolute paths like `/css/base.css` — GitHub Pages serves from a subdirectory (`/study-timer/`), so root-relative paths will break
- `index.html` is the single entry point; there is no server-side routing

## Project Structure

```
study-timer/
  index.html          # Single-page app (all HTML in one file)
  manifest.json       # PWA manifest
  sw.js               # Service worker for offline support
  icon192.png         # PWA icon
  icon512.png         # PWA icon
  css/
    base.css          # Core styles, variables, layout
    timer.css         # Timer and modal styles
    features.css      # Feature-specific styles (reports, calendar, etc.)
  js/
    data.js           # Data layer, GitHub Gist sync, localStorage
    ui.js             # UI helpers, rendering, drag-and-drop
    timer.js          # Timer module (TM) + past session module (PAST)
    plan.js           # Planning module (PLAN)
    calendar.js       # Calendar module (CAL)
    academics.js      # Syllabus (SYL) + Revision (REV) modules
    reports.js        # Reports module (RP)
    tasks.js          # Deadlines (DL) + Reminders (REM) + Recurring (RECUR)
    settings.js       # Reset (RESET) + Notifications (NOTIFY)
    app.js            # Main App module — init, navigation, focus mode, quotes
    todo.js           # To-Do module (TODO)
    summary.js        # Summary & Analytics module (SUM)
```

## Script Loading Order (Critical)

Scripts load synchronously in index.html in this exact order. Dependencies flow top-down — each file can reference modules defined in files loaded before it:

1. `data.js` — `esc()`, `QUOTES`, `D`
2. `ui.js` — `UI`, `DRAG`
3. `timer.js` — `SR`, `TM`, `PAST`
4. `plan.js` — `PLAN`
5. `calendar.js` — `CAL`
6. `academics.js` — `SYL`, `REV`
7. `reports.js` — `RP`
8. `tasks.js` — `DL`, `REM`, `RECUR`
9. `settings.js` — `RESET`, `NOTIFY`
10. `app.js` — `App` (main controller)
11. `todo.js` — `TODO`
12. `summary.js` — `SUM`

**Important:** `app.js` loads before `todo.js` and `summary.js`. Any references to `TODO` or `SUM` inside `app.js` must be wrapped in `try/catch` or deferred (e.g., `setTimeout`).

## Service Worker

- `sw.js` caches all assets listed in `ASSETS` array for offline support
- When adding new files, update the `ASSETS` list in `sw.js`
- Bump the `CACHE` version string in `sw.js` to force cache refresh on deploy

## Key Rules

- No build tools, no bundlers — this is a vanilla HTML/CSS/JS project
- All state is stored in `localStorage` with optional GitHub Gist sync
- Keep files working without a server (file:// protocol) where possible
- Test on mobile — this is a mobile-first PWA

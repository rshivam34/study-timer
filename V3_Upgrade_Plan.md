# STUDY TIMER V3 — COMPLETE UPGRADE PLAN

## NEW FILE STRUCTURE (Modular Split)

```
study-timer/
├── index.html              ← Shell only (HTML structure + <link>/<script> tags)
├── manifest.json           ← PWA manifest (unchanged)
├── sw.js                   ← Service worker (updated to cache all files)
├── icon-192.png            ← App icon (unchanged)
├── icon-512.png            ← App icon (unchanged)
│
├── css/
│   ├── base.css            ← Theme vars, typography, buttons, inputs, cards, core layout
│   ├── timer.css           ← Timer display, session list, difficulty btns, coach, quotes
│   ├── features.css        ← Side panel, calendar, todo, planning, summary, reports, syllabus
│   └── modals.css          ← All modal overlays and modal-specific styles
│
└── js/
    ├── data.js             ← D module: localStorage, GitHub Gist sync, merge, export/import
    ├── timer.js            ← TM + PAST: timer logic, pause/resume, past session add
    ├── ui.js               ← UI + DRAG: rendering helpers, formatting, drag-reorder
    ├── plan.js             ← PLAN module: planning CRUD, templates, carry forward
    ├── calendar.js         ← CAL module: month/week grid, day drill-down, timeline
    ├── todo.js             ← TODO module: unlimited nesting, search, recurring todos
    ├── summary.js          ← SUM module: daily/weekly/monthly summary, journal, analytics
    ├── academics.js        ← REV + SYL: revision spaced repetition, syllabus lectures
    ├── tasks.js            ← DL + REM + RECUR: deadlines, reminders, recurring tasks
    ├── reports.js          ← RP: heatmap, date-range reports, topic log, comparisons
    ├── settings.js         ← RESET + NOTIFY: settings panel, notifications, theme toggle
    └── app.js              ← App: init, navigation, focus mode, quotes, coach, keyboard
```

**Total: 21 files (4 CSS + 12 JS + index.html + manifest + sw.js + 2 icons)**
**Why this split:** Each JS file = 1 feature area. Easy to find, edit, debug. CSS grouped by scope.

---

---

## PART 1: MODULAR RESTRUCTURE + CRITICAL FIXES

> **Scope:** Break monolith → modular files. Fix all critical gaps. Foundation work.
> **Estimated size:** ~2,500 lines across all files (restructured + new code)

### 1A. FILE RESTRUCTURING

| Task | Details |
|------|---------|
| Extract CSS into 4 files | base.css (~150 lines), timer.css (~80 lines), features.css (~120 lines), modals.css (~30 lines) |
| Extract JS into 12 files | Each module gets its own file, properly formatted (not minified) |
| Create shell index.html | Only HTML structure + `<link>` and `<script>` tags |
| Update sw.js | Cache list updated with all 17 new file paths |
| Beautify all code | Expand minified one-liners into readable, indented code |
| Add section comments | Every file gets header comments explaining its purpose |

### 1B. CRITICAL FIXES (From Audit)

| # | Fix | What Changes | File |
|---|-----|-------------|------|
| 1 | **Plan Edit Modal** | Add edit button on each plan card → opens modal pre-filled with plan data → updates in place | `js/plan.js` |
| 2 | **Plan Notes/Description Field** | Add textarea to plan add/edit form; display notes on plan card | `js/plan.js`, `index.html` |
| 3 | **Merge Conflict Fix** | Per-item ID-based merge for plans (not date-key-wins). Same for todos and journal (field-level merge) | `js/data.js` |
| 4 | **Todo Completion Timestamps** | Record `completedAt` when marking done; show "Done 2h ago" on completed items | `js/todo.js` |
| 5 | **Calendar Heatmap Cell Coloring** | Cell background intensity based on total hours (light→dark green/purple) like GitHub heatmap | `js/calendar.js`, `css/features.css` |
| 6 | **Avg Session Length in Daily Summary** | Currently shows longest but not average; add average session row | `js/summary.js` |
| 7 | **Scroll Calendar to Today** | On calendar load, auto-scroll so today's cell is visible | `js/calendar.js` |
| 8 | **Session Count on Calendar Cells** | Show tiny number like "3s" (3 sessions) alongside hours | `js/calendar.js` |
| 9 | **Plan Actual vs Estimated Hours** | When session linked to plan, accumulate actual hours; show "Est: 2h | Done: 1.5h" | `js/plan.js`, `js/timer.js` |
| 10 | **Todo Search Bar** | Search input that filters across ALL nesting levels by title/content keyword | `js/todo.js`, `index.html` |

### 1C. PART 1 DELIVERABLES

```
Files created/modified:
├── index.html              (NEW - shell, ~250 lines)
├── sw.js                   (MODIFIED - new cache list)
├── css/base.css            (NEW - ~170 lines)  
├── css/timer.css           (NEW - ~90 lines)
├── css/features.css        (NEW - ~160 lines, + heatmap cell colors)
├── css/modals.css          (NEW - ~40 lines)
├── js/data.js              (NEW - ~120 lines, improved merge)
├── js/timer.js             (NEW - ~80 lines, plan actual hours tracking)
├── js/ui.js                (NEW - ~70 lines)
├── js/plan.js              (NEW - ~220 lines, +edit modal, +notes, +actual hours)
├── js/calendar.js          (NEW - ~200 lines, +heatmap colors, +session count, +scroll)
├── js/todo.js              (NEW - ~320 lines, +completion timestamps, +search)
├── js/summary.js           (EXISTING - moved, +avg session)
├── js/academics.js         (NEW - ~100 lines)
├── js/tasks.js             (NEW - ~200 lines)
├── js/reports.js           (NEW - ~60 lines)
├── js/settings.js          (NEW - ~50 lines)
├── js/app.js               (NEW - ~250 lines)
```

---

---

## PART 2: ANALYTICS & SUMMARY MEGA UPGRADE

> **Scope:** Transform Summary & Analytics from 6.5/10 to 10/10. Rich visualizations, insights, comparisons.
> **Estimated size:** ~600 lines of new/modified code
> **Files touched:** `js/summary.js`, `js/plan.js`, `js/reports.js`, `css/features.css`, `index.html`

### 2A. WEEKLY SUMMARY ENHANCEMENTS

| # | Feature | Details | File |
|---|---------|---------|------|
| 1 | **Best & Worst Day Labels** | Highlight which day had highest/lowest study hours in the week bar chart | `js/summary.js` |
| 2 | **Weekly Grade (A→F)** | Grade based on: goal achievement % (40%), plan completion % (30%), consistency/streak (30%). Show as big letter badge | `js/summary.js` |
| 3 | **Week-over-Week Comparison** | Delta cards: "Study: 18.5h ↑12% vs last week", "Sessions: 23 ↓3", "Plan Completion: 85% ↑10%" with green/red arrows | `js/summary.js` |
| 4 | **Stacked Bar Chart** | Study + Work bars stacked per day (not just study), with different colors | `js/summary.js` |
| 5 | **Work Hours in Weekly** | Currently only tracks study in weekly; add work hours breakdown too | `js/summary.js` |

### 2B. MONTHLY SUMMARY OVERHAUL

| # | Feature | Details | File |
|---|---------|---------|------|
| 6 | **Monthly Trend Chart** | Day-by-day bar chart (31 bars) showing study hours per day across the month. Color intensity = more hours | `js/summary.js` |
| 7 | **Monthly Subject Donut** | Pie/donut chart of subject distribution for the entire month (like weekly but bigger scope) | `js/summary.js` |
| 8 | **Monthly Grade (A→F)** | Same formula as weekly but across month data | `js/summary.js` |
| 9 | **Month-over-Month Comparison** | "vs. Last Month" delta cards for total hours, sessions, avg/day, plan completion | `js/summary.js` |
| 10 | **Best/Worst Day of Month** | Highlight the single best and worst study days | `js/summary.js` |
| 11 | **Monthly Plan Accuracy** | "You estimated 45h total but did 38h — 84% accuracy" across all plans in month | `js/summary.js`, `js/plan.js` |

### 2C. ANALYTICS DASHBOARD UPGRADE

| # | Feature | Details | File |
|---|---------|---------|------|
| 12 | **Day-Type Performance Analysis** | Card: "Office days: avg 2.1h | WFH days: avg 4.8h | Weekends: avg 6.2h" with bar comparison. Uses journal dayType data | `js/summary.js` |
| 13 | **Rolling 7d & 30d Averages** | Two trend lines overlaid: 7-day rolling avg (volatile) + 30-day rolling avg (smooth). Shows direction | `js/summary.js` |
| 14 | **Subject Consistency Chart** | Per-subject: "Math: studied 18/30 days (60%) | Physics: 8/30 days (27%)" with progress bars | `js/summary.js` |
| 15 | **Session Length Trend** | "Your avg session went from 42min → 1h08min over 30 days" with mini line chart | `js/summary.js` |
| 16 | **Productive Time Detection** | "Your peak productivity: 9–11 AM (avg 1.2h/session) vs 4–6 PM (avg 0.6h/session)" | `js/summary.js` |
| 17 | **Study Streak Dashboard** | Current streak, longest streak ever, streak calendar (dots for each day), streak milestones | `js/summary.js` |
| 18 | **Goal Achievement Calendar** | Mini month grid: green = goal met, red = missed, gray = no data. Quick visual | `js/summary.js` |
| 19 | **Focus Score** | Composite score (0–100) based on: avg session length, consistency, goal %, plan completion. Gamification | `js/summary.js` |

### 2D. PLAN ANALYTICS

| # | Feature | Details | File |
|---|---------|---------|------|
| 20 | **Plan Completion Trend** | "This week: 85% plans done | Last week: 72% | Trend: ↑" chart over 4 weeks | `js/plan.js`, `js/summary.js` |
| 21 | **Estimation Accuracy Score** | "You estimate 20% more time than needed" or "You underestimate by 15%" based on est vs actual | `js/plan.js`, `js/summary.js` |
| 22 | **Subject Balance Radar** | Which subjects are over/under-planned vs actually studied | `js/summary.js` |

### 2E. PART 2 DELIVERABLES

```
Files modified:
├── js/summary.js           (MAJOR REWRITE - ~600 lines, all analytics)
├── js/plan.js              (MINOR - plan accuracy tracking functions)
├── js/reports.js           (MINOR - link heatmap data)
├── css/features.css        (ADD - chart styles, grade badges, delta cards, radar, trend lines)
├── index.html              (ADD - new summary sub-sections HTML containers)
```

---

---

## PART 3: UX POLISH + ADVANCED FEATURES

> **Scope:** Everything that makes it feel premium. Interactions, notifications, convenience features.
> **Estimated size:** ~500 lines of new/modified code
> **Files touched:** Most JS files, CSS, index.html

### 3A. NOTIFICATIONS & REMINDERS

| # | Feature | Details | File |
|---|---------|---------|------|
| 1 | **End-of-Day Journal Reminder** | Notification at bedtime (from config) if journal is empty: "Don't forget to fill your daily journal!" | `js/settings.js`, `js/summary.js` |
| 2 | **Overdue To-Do Alerts** | Red badge on To-Do nav item showing count of overdue items. Red highlight on overdue items in list | `js/todo.js`, `js/app.js`, `css/features.css` |
| 3 | **To-Do Due Date Reminders** | If a to-do has a due date = today, show notification in morning | `js/todo.js`, `js/settings.js` |
| 4 | **Plan Reminder** | "You have 3 unfinished plans for today" notification at a configurable hour | `js/plan.js`, `js/settings.js` |

### 3B. JOURNAL ENHANCEMENTS

| # | Feature | Details | File |
|---|---------|---------|------|
| 5 | **Quick Journal Tags** | Clickable preset tags: "Productive", "Distracted", "Tired", "Motivated", "Stressed", "Relaxed", "Focused", "Procrastinated" — stored as array, shown as colored pills | `js/summary.js`, `css/features.css`, `index.html` |
| 6 | **Journal Streak** | "You've journaled 12 days in a row!" displayed in journal section | `js/summary.js` |
| 7 | **Mood Trend** | Mini sparkline of last 7 days' mood ratings in journal section | `js/summary.js` |

### 3C. CALENDAR ENHANCEMENTS

| # | Feature | Details | File |
|---|---------|---------|------|
| 8 | **Calendar Week View Toggle** | Button to switch between Month view and Week view (7-day strip with hourly time blocks showing sessions) | `js/calendar.js`, `css/features.css`, `index.html` |
| 9 | **Calendar Plan Status Colors** | In month view, plan dots show: purple-filled = all done, purple-hollow = some pending | `js/calendar.js`, `css/features.css` |
| 10 | **Calendar Quick-Add Session** | "+" button on each day in detail panel to quick-add a past session for that date | `js/calendar.js` |
| 11 | **Calendar Export (.ics)** | Button to export current month's sessions as .ics file for Google Calendar import | `js/calendar.js` |

### 3D. TO-DO ADVANCED FEATURES

| # | Feature | Details | File |
|---|---------|---------|------|
| 12 | **Drag-to-Reorder To-Dos** | Touch/mouse drag to reorder items within a list level (uses sortOrder field) | `js/todo.js`, `css/features.css` |
| 13 | **Recurring To-Dos** | Toggle on a to-do: "Repeat: Daily / Weekly / Monthly". Auto-creates new instance when marked done | `js/todo.js` |
| 14 | **Session → To-Do Linking** | In save modal, option to mark a to-do as done (similar to "From Plan?" dropdown) | `js/timer.js`, `js/todo.js`, `index.html` |
| 15 | **Bulk Actions** | "Select All" checkbox → Mark done / Delete selected | `js/todo.js`, `index.html` |
| 16 | **To-Do Progress Bar** | At top of to-do section: "12/18 done (67%)" with visual progress bar | `js/todo.js`, `css/features.css` |

### 3E. PLANNING ADVANCED FEATURES

| # | Feature | Details | File |
|---|---------|---------|------|
| 17 | **Plan Templates** | "Save as Template" button on a day's plans. "Load Template" button to apply saved template to any day | `js/plan.js`, `index.html` |
| 18 | **Drag-to-Reorder Plans** | Reorder plan items within a day via drag (uses sortOrder) | `js/plan.js` |
| 19 | **Copy Day's Plans** | "Copy to another date" — duplicate all plans from one day to another | `js/plan.js` |
| 20 | **Plan Color Coding** | Each plan card has left border color matching its subject color | `js/plan.js`, `css/features.css` |

### 3F. GLOBAL POLISH

| # | Feature | Details | File |
|---|---------|---------|------|
| 21 | **Export Summary as Image** | "📸 Save" button on daily/weekly/monthly summary → renders as PNG using canvas API | `js/summary.js` |
| 22 | **Productive Time Insights Toast** | After saving session: "Great! This was your 3rd session today. You're 72% to your goal!" | `js/timer.js` |
| 23 | **Onboarding Hints** | First-time tooltips on new features: "New! Click here to plan your day", auto-dismiss after 1 use | `js/app.js` |
| 24 | **Keyboard Shortcuts for New Features** | P = Planning, C = Calendar, T = To-Do, U = Summary. Shown in help tooltip | `js/app.js` |
| 25 | **Dark Mode Audit** | Verify all new components have proper dark/light contrast (calendar cells, chart bars, badges) | `css/*.css` |
| 26 | **PWA Offline Indicator** | Small banner "You're offline — changes will sync when connected" | `js/app.js`, `css/base.css` |

### 3G. PART 3 DELIVERABLES

```
Files modified:
├── index.html              (ADD - week view HTML, template modal, bulk actions UI, progress bar)
├── css/features.css        (ADD - week view grid, overdue badges, drag states, progress bars)
├── js/todo.js              (MAJOR - drag, recurring, bulk, progress, search upgrade, session link)
├── js/plan.js              (ADD - templates, drag, copy, color coding)
├── js/calendar.js          (ADD - week view, plan colors, quick-add, .ics export)
├── js/summary.js           (ADD - journal tags, mood trend, journal streak, export image)
├── js/timer.js             (ADD - todo link in save modal, productivity toast)
├── js/settings.js          (ADD - journal reminder, plan reminder, todo reminders)
├── js/app.js               (ADD - onboarding, new keyboard shortcuts, offline indicator)
├── sw.js                   (MINOR - offline detection support)
```

---

---

## GRAND TOTAL: ALL IMPROVEMENTS ACROSS 3 PARTS

| Category | Part 1 | Part 2 | Part 3 | Total |
|----------|--------|--------|--------|-------|
| Critical Fixes | 10 | — | — | 10 |
| Analytics Features | 1 | 22 | — | 23 |
| UX Features | — | — | 17 | 17 |
| Advanced Features | — | — | 9 | 9 |
| File Restructure | 21 files | — | — | 21 files |
| **Total New Features** | **11** | **22** | **26** | **59 features** |

### After all 3 parts, the audit scores become:

| Feature Area | Before | After | Change |
|-------------|--------|-------|--------|
| Navigation | 10/10 | 10/10 | — |
| Planning | 8.5/10 | 10/10 | +1.5 |
| Calendar | 8.5/10 | 10/10 | +1.5 |
| To-Do | 8/10 | 10/10 | +2 |
| Summary & Analytics | 6.5/10 | 10/10 | +3.5 |
| Timer Save Flow | 10/10 | 10/10 | — |
| Data Integrity | 9/10 | 10/10 | +1 |
| Existing Features | 10/10 | 10/10 | — |
| **Overall** | **8.8/10** | **10/10** | **+1.2** |

---

## READY?

**Say "Start" and I'll begin PART 1** — the modular file restructure + all 10 critical fixes.

# Study Timer V2 — Complete Audit & Improvement Plan

---

## PART 1: FEATURE-BY-FEATURE AUDIT

### ✅ = Fully Built | ⚠️ = Built but has gaps | ❌ = Missing/Not Built

---

### 1. NAVIGATION OVERHAUL

| Item | Status | Details |
|------|--------|---------|
| Hamburger menu (☰) | ✅ | Top-left button triggers side panel |
| Side panel slides out | ✅ | 280px, smooth animation, overlay backdrop |
| 12 sections in menu | ✅ | Study, Work, Planning, Calendar, To-Do, Summary, Reports, Syllabus, Revision, Reminders, Recurring, Settings |
| Old horizontal tabs removed | ✅ | Replaced entirely, no `.tabs` class found |
| Active state highlighting | ✅ | `.sp-nav a.active` styling |
| Mobile-friendly | ✅ | Overlay click closes, swipe-ready |
| Keyboard shortcuts preserved | ✅ | Keys 1-8 still work for original tabs |

**Verdict: 100% complete. No gaps.**

---

### 2. PLANNING SECTION

| Item | Status | Details |
|------|--------|---------|
| Plan date picker | ✅ | `planDate` input, defaults to today |
| Subject dropdown | ✅ | Auto-populated from study subjects |
| Type dropdown | ✅ | topic/lecture/revision/practice/other |
| Topic text field | ✅ | Free text input |
| Estimated hours | ✅ | `planHours` number input |
| Priority dropdown | ✅ | critical/high/medium/low |
| Lecture number from syllabus | ✅ | `planLecNum` auto-populated |
| Day type templates | ✅ | Office (3h), WFH (5.5h), Even Sat (7h), Full Day (13h) — 6 references |
| Plan statuses | ✅ | planned → in-progress → completed → skipped → carried |
| Start plan (▶ button) | ✅ | Changes status to in-progress |
| Complete plan (✓ button) | ✅ | `PLAN.completePlan()` |
| Remove plan (✕ button) | ✅ | `PLAN.remove()` |
| Carry forward | ✅ | Moves pending items to next day, marks old as "carried" |
| Plan view by date | ✅ | `planViewDate` lets you browse any day's plans |
| **Edit existing plan** | ❌ | **No edit button or modal — can only remove and re-add** |
| **Plan notes/description** | ❌ | **No notes field on plan items** |
| **Plan estimated vs actual hours** | ⚠️ | **Estimated hours saved, but actual hours not tracked per-plan** |
| **Reorder plans (drag)** | ❌ | **No drag-to-reorder within a day's plans** |

**Verdict: ~85% complete. Missing edit functionality and actual-vs-estimated tracking.**

---

### 3. CALENDAR VIEW

| Item | Status | Details |
|------|--------|---------|
| Monthly grid (7 columns) | ✅ | `.cal-grid` CSS grid layout |
| Previous/Next month nav | ✅ | `CAL.prev()`, `CAL.next()` |
| Color-coded dots | ✅ | Purple = plans, Orange = study, Cyan = work |
| Total hours per cell | ✅ | `.cal-hrs` displayed |
| Today highlighting | ✅ | `.today` class on current date |
| Click day → detail panel | ✅ | `CAL.selectDay()` opens drill-down |
| Plans shown in detail | ✅ | All plan items with status badges |
| Sessions timeline | ✅ | Chronological list with time range (HH:MM → HH:MM), subject badge, topic, duration |
| Timeline dots (study=orange, work=cyan) | ✅ | `.tl-item::before` with color variants |
| Add plan from calendar | ✅ | "+ Plan" button calls `CAL.addPlanForDay()` |
| **Week view toggle** | ❌ | **Only monthly view — no weekly layout option** |
| **Session count on cell** | ❌ | **Only hours shown, not # of sessions** |
| **Scroll to today on load** | ⚠️ | **Today is highlighted but not auto-scrolled to if off-screen** |
| **Mini-heatmap coloring on cells** | ❌ | **Cells don't change background intensity based on hours** |

**Verdict: ~85% complete. Core calendar works great, missing nice-to-haves.**

---

### 4. TO-DO SYSTEM (UNLIMITED NESTING)

| Item | Status | Details |
|------|--------|---------|
| Unlimited nesting depth | ✅ | Recursive `renderItem()` and `findItem()` |
| Children array | ✅ | Each item has `children: [...]` |
| Type: To-Do and Note | ✅ | Dropdown selector |
| Priority: Critical/High/Medium/Low | ✅ | Color-coded checkboxes (🔴🟠🟡🟢) |
| Due date | ✅ | `todoInpDue` date input |
| Status toggle (pending/done) | ✅ | `toggleDone()` with checkbox UI |
| Collapsible children | ✅ | `.todo-expand-btn` toggle |
| Sort: Priority / Date / Smart Mix | ✅ | `todoSortMode` dropdown |
| Status filter: All / Pending / Done | ✅ | `todoStatusFilter` dropdown |
| Separate Study/Work lists | ✅ | `todoTypeFilter` dropdown |
| Inline preview on Study/Work tabs | ✅ | Top 5 pending tasks, priority-sorted, with checkboxes |
| Add child (sub-item) | ✅ | `TODO.addChild()` |
| Edit item | ✅ | `TODO.editItem()` with modal |
| Delete with children | ✅ | Recursive delete |
| Note content body | ✅ | `.todo-note-body` for notes |
| **Drag to reorder** | ❌ | **No drag-and-drop sorting** |
| **Swipe gestures** | ❌ | **No swipe-to-complete or swipe-to-delete** |
| **Search within to-dos** | ❌ | **No search/filter by keyword** |
| **Due date reminders** | ❌ | **No notification for overdue to-dos** |
| **Completion timestamp** | ❌ | **No record of when a to-do was marked done** |
| **Recurring to-dos** | ❌ | **Can't set a to-do to repeat** |

**Verdict: ~80% complete. Core unlimited nesting works perfectly. Missing polish features.**

---

### 5. SUMMARY & ANALYTICS

#### 5A — Daily Summary Card (Auto-calculated)

| Item | Status | Details |
|------|--------|---------|
| Study hours | ✅ | Sum from sessions |
| Work hours | ✅ | Sum from sessions |
| Total hours | ✅ | Study + Work |
| Session count | ✅ | `totalSess` |
| Subjects covered | ✅ | Comma-separated from sessions |
| Topics (first 3 + "more") | ✅ | From session notes |
| Plan completion % | ✅ | Done / Total plans |
| Longest session | ✅ | Max duration |
| Avg session length | ⚠️ | **Longest is shown, average may be missing** |
| Date selector | ✅ | `sumDate` input to view any day |

#### 5B — Daily Journal (Manual)

| Item | Status | Details |
|------|--------|---------|
| Day Type dropdown | ✅ | Office/WFH/Even Sat/Odd Sat/Sunday/Leave/Holiday |
| Day Rating (1-5 stars) | ✅ | `SUM.setRating()` clickable buttons |
| Mood (5 emojis) | ✅ | 😤😞😐😊🤩 selector with `.mood-btn` |
| What Went Right | ✅ | Textarea, auto-saves on blur |
| What Went Wrong | ✅ | Textarea, auto-saves on blur |
| Notes/Triggers | ✅ | Textarea, auto-saves on blur |
| Auto-save | ✅ | `saveJournal()` on blur and on change |
| **End-of-day journal reminder** | ❌ | **No notification/popup to fill journal** |
| **Quick tags/labels** | ❌ | **No preset tags like "productive", "distracted"** |

#### 5C — Weekly Summary (Auto)

| Item | Status | Details |
|------|--------|---------|
| Week date range | ✅ | Calculated from selected date |
| Total study/work hours | ✅ | Aggregated across 7 days |
| Bar chart (7 days) | ✅ | `.chart-bars` with study bars + hover tooltips |
| Subject breakdown | ✅ | `subjectTime` with legend dots |
| Donut chart | ✅ | CSS `conic-gradient` based pie chart |
| **Best/Worst day label** | ❌ | **Not explicitly called out** |
| **Week grade (A/B/C/D/F)** | ❌ | **No grading system** |
| **Week-over-week comparison** | ❌ | **No comparison with previous week** |

#### 5D — Monthly Summary (Auto)

| Item | Status | Details |
|------|--------|---------|
| Days tracked | ✅ | Count of days with sessions |
| Total study/work | ✅ | Aggregated across month |
| Avg study/day | ✅ | Calculated |
| Total sessions | ✅ | Counted |
| **Monthly trend line** | ❌ | **No day-by-day trend visualization** |
| **Subject donut chart for month** | ❌ | **Only in weekly, not monthly** |
| **Month grade** | ❌ | **No grading** |
| **Month-over-month comparison** | ❌ | **No comparison with previous month** |
| **Calendar heatmap in summary** | ❌ | **Heatmap exists in Reports, not linked in Summary** |

#### 5E — Analytics Dashboard

| Item | Status | Details |
|------|--------|---------|
| Study streak | ✅ | Consecutive days meeting goal (calculated backwards) |
| Peak study hour | ✅ | 24-hour buckets, bar chart 5am-11pm |
| Goal achievement rate | ✅ | % of days goal was met |
| Hour distribution chart | ✅ | Bars showing study time per hour |
| **Day-type performance analysis** | ❌ | **No comparison: "Office days avg X hrs vs WFH avg Y hrs"** |
| **Rolling averages (7d/30d)** | ❌ | **No rolling average trend lines** |
| **Subject consistency chart** | ❌ | **No "how often do you study each subject" analysis** |
| **Productive time detection** | ❌ | **No "your most productive time is 9-11 AM" insight** |
| **Session length trend** | ❌ | **No "avg session length over time" chart** |

**Overall Summary & Analytics Verdict: ~65% complete. Core daily/weekly works well. Monthly and analytics are basic — significant room for rich insights.**

---

### 6. ENHANCED TIMER SAVE FLOW

| Item | Status | Details |
|------|--------|---------|
| "From Plan?" dropdown | ✅ | `smFromPlan` populated with today's plans |
| Auto-populate plans for subject | ✅ | `PLAN.getTodayPlansForSubject()` |
| Auto-fill topic from plan | ✅ | `onPlanSelect()` handler |
| "Lecture completed?" section | ✅ | Only shown if subject has syllabus |
| Lecture action dropdown | ✅ | "No lecture" / "Yes, mark done" |
| Lecture number selector | ✅ | Shows all lectures, completed in green ✓ |
| Defaults to next undone lecture | ✅ | Smart default selection |
| Marks plan as completed on save | ✅ | `PLAN.completePlan()` called |
| Marks lecture in syllabus | ✅ | `syl[cat].done = Math.max(done, lecNum)` |
| Refreshes to-do inline preview | ✅ | `TODO.renderInline()` called post-save |

**Verdict: 100% complete. This is the most polished feature.**

---

### 7. DATA INTEGRITY

| Item | Status | Details |
|------|--------|---------|
| Plans in data structure | ✅ | `plans: { 'YYYY-MM-DD': [...] }` |
| Todos in data structure | ✅ | `todos: { study: [...], work: [...] }` |
| Journal in data structure | ✅ | `journal: { 'YYYY-MM-DD': {...} }` |
| Merge handles plans | ✅ | Merges by date key |
| Merge handles todos | ✅ | Merges by group (study/work) |
| Merge handles journal | ✅ | Merges by date key |
| GitHub Gist sync works | ✅ | All new data included in push/pull |
| Export/Import includes new data | ✅ | Via merge function |
| Service worker updated | ✅ | Cache version bumped to v5 |
| **Merge conflict resolution** | ⚠️ | **Simple "first wins" — no per-item merge for plans/todos in same date key** |

---

### 8. EXISTING FEATURES PRESERVED

| Feature | Status |
|---------|--------|
| Timer (study/work with pause/resume) | ✅ |
| Session tracking with past session add | ✅ |
| GitHub Gist sync | ✅ |
| Focus mode (moving timer) | ✅ |
| Revision (spaced repetition) | ✅ |
| Syllabus (lecture tracking) | ✅ |
| Deadlines (countdown, edit) | ✅ |
| Recurring tasks | ✅ |
| Reports (heatmap, date range, topic log) | ✅ |
| Competition Coach | ✅ |
| Quotes (rotating) | ✅ |
| Theme toggle (dark/light) | ✅ |
| PWA (install, offline) | ✅ |
| Notifications | ✅ |
| Settings (subjects, export, reset) | ✅ |
| Keyboard shortcuts | ✅ |

**All 16 existing features preserved. No regressions.**

---

---

## PART 2: WHAT CAN BE IMPROVED

### 🔴 CRITICAL (Functionality Gaps)

1. **Plan Edit Button Missing**
   - Currently: You can only remove and re-add a plan
   - Fix: Add edit modal (pre-fill fields, update in place)
   - Impact: Major usability issue — users frequently need to tweak plans

2. **Merge Conflict for Same-Date Plans/Todos**
   - Currently: First device wins when same date has plans on both devices
   - Fix: Per-item ID-based merge (like sessions already do)
   - Impact: Data loss risk for multi-device users

3. **Monthly Summary is Bare-Bones**
   - Currently: Just 4 numbers (days tracked, hours, avg, sessions)
   - Fix: Add monthly trend chart, subject donut, best/worst day, monthly grade
   - Impact: The Excel reference had rich monthly analytics — currently far behind

4. **No Day-Type Performance Analysis**
   - You have day types (Office/WFH/etc.) but never analyze "you study 2x more on WFH days"
   - Fix: Add day-type comparison cards in analytics
   - Impact: This was a core insight from the Excel tracker

---

### 🟠 HIGH (Significant UX Improvements)

5. **No End-of-Day Journal Reminder**
   - Fix: Notification at bedtime (from settings) saying "Fill your daily journal"
   - Impact: Without this, journal will be empty most days

6. **No Week-over-Week / Month-over-Month Comparisons**
   - Fix: Show delta cards (↑12% study hours vs last week) like the existing "compare" section in Reports
   - Impact: Progress tracking is the #1 motivator

7. **Actual vs Estimated Hours per Plan**
   - Fix: When a session is linked to a plan, accumulate actual hours; show "Est: 2h | Actual: 1.5h"
   - Impact: Helps calibrate future planning accuracy

8. **Calendar Cell Intensity (Mini-Heatmap)**
   - Fix: Background shade on calendar cells based on hours (light → dark green)
   - Impact: Instant visual of productive vs empty days — like the Reports heatmap

9. **To-Do Completion Timestamps**
   - Fix: Record `completedAt` when marking done; show in history
   - Impact: Needed for productivity analytics and streaks

10. **To-Do Search**
    - Fix: Add search bar in to-do section (filters across all nesting levels)
    - Impact: Once you have 50+ to-dos, finding things becomes painful

---

### 🟡 MEDIUM (Nice-to-Have Enhancements)

11. **Drag-to-Reorder Plans & To-Dos**
    - Fix: HTML5 drag-drop or touch-sortable library
    - Impact: Priority ordering is manual and clunky

12. **Rolling Averages (7-day / 30-day)**
    - Fix: Add trend lines in analytics showing moving averages
    - Impact: Smooths out daily noise, shows true trajectory

13. **Subject Consistency Chart**
    - Fix: "You've studied Math 15 of last 30 days, Physics only 5"
    - Impact: Prevents neglecting subjects

14. **Weekly/Monthly Grade System**
    - Fix: A-F grades based on goal achievement %, plan completion, consistency
    - Impact: Gamification keeps you engaged

15. **Overdue To-Do Alerts**
    - Fix: Red badge on to-do count when items are past due
    - Impact: Prevents forgotten tasks

16. **Quick Journal Tags**
    - Fix: Preset clickable tags like "productive", "distracted", "tired", "motivated"
    - Impact: Faster journaling → higher completion rate

17. **Session Length Trend Chart**
    - Fix: "Your avg session went from 45min → 1h12min over 30 days"
    - Impact: Shows focus improvement over time

18. **Calendar Week View**
    - Fix: Toggle between month view and week view (7-day strip with hourly blocks)
    - Impact: Better for seeing daily time allocation detail

---

### 🟢 LOW (Polish & Delight)

19. **Swipe Gestures on To-Dos** (swipe right = done, left = delete)
20. **Recurring To-Dos** (daily standup list, weekly review)
21. **Plan Templates** (save a day's plan as template, reuse later)
22. **Export Summary as PDF** (daily/weekly/monthly)
23. **Calendar Sync** (export as .ics for Google Calendar)
24. **Dark Mode Calendar** (verify contrast on all cell states)
25. **Onboarding Tour** (first-time walkthrough of new features)
26. **Session Linking to To-Do** (not just plans — mark a to-do as "done via session")

---

---

## PART 3: SCORE SUMMARY

| Feature Area | Promised | Delivered | Score |
|-------------|----------|-----------|-------|
| Navigation | Side panel, 12 sections | All delivered | **10/10** |
| Planning | CRUD, templates, carry forward, lecture link | Missing edit, no actual-vs-estimated | **8.5/10** |
| Calendar | Monthly grid, dots, drill-down, timeline | Missing week view, heatmap coloring | **8.5/10** |
| To-Do (Unlimited Nesting) | Recursive, priority, filter, inline preview | Missing drag, search, completion time | **8/10** |
| Summary & Analytics | Daily+Journal+Weekly+Monthly+Analytics | Monthly bare, no day-type analysis, no comparisons | **6.5/10** |
| Timer Save Flow | Plan link, lecture mark, auto-complete | Everything works | **10/10** |
| Data Integrity | Merge, sync, export | Works but merge is simple | **9/10** |
| Existing Features | All 16 preserved | No regressions | **10/10** |

### **Overall: 8.8/10 delivered vs promised. Summary/Analytics is the weakest area with the most room for improvement.**

---

## PART 4: RECOMMENDED IMPROVEMENT PRIORITY

**If you want me to build improvements, here's the order I'd recommend:**

### Phase 1 — Quick Wins (1 session)
- ✏️ Plan edit button + modal
- 📊 Monthly trend chart + subject donut
- 🔔 End-of-day journal reminder notification
- 📈 Week-over-week delta comparison cards

### Phase 2 — Rich Analytics (1 session)
- 📊 Day-type performance analysis (Office vs WFH vs Weekend)
- 📉 Rolling 7d/30d average trend lines
- 🏆 Weekly/Monthly grade system (A-F)
- ⏱️ Actual vs Estimated hours on plans
- 📊 Subject consistency chart

### Phase 3 — UX Polish (1 session)
- 🔍 To-Do search across all levels
- 🎨 Calendar cell heatmap coloring
- ⏰ Overdue to-do alerts
- 🏷️ Quick journal tags
- 📅 Calendar week view

### Phase 4 — Advanced (1 session)
- 🔀 Drag-to-reorder for plans & to-dos
- 🔄 Recurring to-dos
- 📋 Plan templates (save/reuse)
- 📄 Export summary as image/PDF

/* =========================================
   AI SMART MULTI-EXAM STRATEGY PLANNER
   Single Bundled Script (no ES modules)
   ========================================= */

'use strict';

// ════════════════════════════════════════════════════════════════
//  STORAGE MODULE
// ════════════════════════════════════════════════════════════════

const KEYS = {
  STUDENT: 'aiPlanner_student',
  SUBJECTS: 'aiPlanner_subjects',
  STREAK: 'aiPlanner_streak',
  THEME: 'aiPlanner_theme'
};

function saveStudent(data) { localStorage.setItem(KEYS.STUDENT, JSON.stringify(data)); }
function loadStudent() { try { return JSON.parse(localStorage.getItem(KEYS.STUDENT)) || null; } catch { return null; } }
function saveSubjects(d) { localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(d)); }
function loadSubjects() { try { return JSON.parse(localStorage.getItem(KEYS.SUBJECTS)) || []; } catch { return []; } }
function saveStreak(d) { localStorage.setItem(KEYS.STREAK, JSON.stringify(d)); }
function loadStreak() { try { return JSON.parse(localStorage.getItem(KEYS.STREAK)) || { count: 0, lastDate: null }; } catch { return { count: 0, lastDate: null }; } }
function saveTheme(t) { localStorage.setItem(KEYS.THEME, t); }
function loadTheme() { return localStorage.getItem(KEYS.THEME) || null; }
function clearAll() { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); }

// ════════════════════════════════════════════════════════════════
//  STREAK MODULE
// ════════════════════════════════════════════════════════════════

function updateStreak() {
  const stored = loadStreak();
  const todayStr = new Date().toISOString().split('T')[0];
  if (stored.lastDate === todayStr) return stored;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const newCount = stored.lastDate === yesterdayStr ? stored.count + 1 : 1;
  const updated = { count: newCount, lastDate: todayStr };
  saveStreak(updated);
  return updated;
}

function getStreakBadge(count) {
  if (count >= 30) return { emoji: '🔥🔥🔥', label: 'Legendary' };
  if (count >= 14) return { emoji: '🔥🔥', label: 'On Fire' };
  if (count >= 7) return { emoji: '🔥', label: 'Hot Streak' };
  if (count >= 3) return { emoji: '⚡', label: 'Building Up' };
  return { emoji: '✨', label: 'Just Started' };
}

// ════════════════════════════════════════════════════════════════
//  AI ENGINE MODULE
// ════════════════════════════════════════════════════════════════

const DIFFICULTY_WEIGHT = { Easy: 1, Medium: 2, Hard: 3 };
const CONFIDENCE_WEIGHT = { High: 1, Medium: 2, Low: 3 };

function getDaysRemaining(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr); exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam - today) / 86400000);
}

function calcPriorityScore(subject) {
  const days = getDaysRemaining(subject.examDate);
  const safeDay = Math.max(days, 1);
  const urgency = Math.min(40, Math.round(40 / Math.log2(safeDay + 1)));
  const difficulty = (DIFFICULTY_WEIGHT[subject.difficulty] / 3) * 25;
  const remaining = ((100 - subject.syllabusCompletion) / 100) * 25;
  const confidence = (CONFIDENCE_WEIGHT[subject.confidence] / 3) * 10;
  return Math.round(urgency + difficulty + remaining + confidence);
}

function allocateHours(subjects, dailyHours) {
  const scored = subjects.map(s => ({ ...s, score: calcPriorityScore(s), days: getDaysRemaining(s.examDate) }));
  const totalScore = scored.reduce((sum, s) => sum + s.score, 0) || 1;
  return scored.map(s => {
    let raw = (s.score / totalScore) * dailyHours;
    raw = Math.round(raw * 2) / 2;
    raw = Math.max(0.5, Math.min(raw, dailyHours * 0.7));
    return { ...s, allocatedHours: raw };
  });
}

function formatTime(decimalHour) {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  const suffix = h < 12 ? 'AM' : 'PM';
  const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}

function getDailyActivity(subject, board) {
  if (subject.syllabusCompletion < 40) return '📖 Learn New Topics + Note-taking';
  if (subject.confidence === 'Low') {
    if (board === 'ICSE') return '✍️ Answer Writing + Long Answer Practice';
    if (board === 'State Board') return '📋 Prev Year Papers + Important Questions';
    return '🔁 Deep Revision + Practice Problems';
  }
  if (subject.difficulty === 'Hard') return '🧩 Concept Mastery + Solved Examples';
  if (board === 'CBSE') return '📗 NCERT Revision + Mock Test Prep';
  return '✅ Revision + Flash Cards';
}

function generateDailyPlan(subjects, dailyHours, board) {
  const allocated = allocateHours(subjects, dailyHours);
  const sorted = [...allocated].sort((a, b) => b.score - a.score);
  const plan = [];
  let hour = 8;
  sorted.forEach(s => {
    const h = s.allocatedHours;
    plan.push({
      time: `${formatTime(hour)} – ${formatTime(hour + h)}`,
      subject: s.name,
      activity: getDailyActivity(s, board),
      hours: h,
      daysLeft: s.days
    });
    hour += h + 0.25;
  });
  return plan;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_THEMES = [
  'Core Concepts', 'Practice & Exercises', 'Deep Dive / Weak Topics',
  'Mock Test / Assessment', 'Revision & Summaries', 'Catchup + Previous Papers', 'Rest & Light Review'
];

function getWeeklyActivity(subject, board, dayIndex) {
  const acts = {
    CBSE: ['NCERT Reading', 'NCERT Exercises', 'Exemplar Problems', 'Mock Test', 'NCERT Revision', 'Full Mock Paper', 'Light Review'],
    ICSE: ['Theory Study', 'Answer Writing', 'Long Answers Drill', 'Essay Practice', 'Revision', 'Previous Papers', 'Light Review'],
    'State Board': ['Chapter Study', 'Important Questions', 'PYQ Practice', 'Full Paper', 'Key Points Revision', 'Imp. Q Revision', 'Rest'],
    Other: ['Study', 'Practice', 'Deep Dive', 'Test', 'Revision', 'Past Papers', 'Rest']
  };
  return (acts[board] || acts.Other)[dayIndex] || 'Study';
}

function generateWeeklyTimetable(subjects, dailyHours, board) {
  const allocated = allocateHours(subjects, dailyHours);
  const sorted = [...allocated].sort((a, b) => b.score - a.score);
  return DAYS.map((day, idx) => {
    const isRest = idx === 6;
    const rows = isRest
      ? [{ subject: 'All Subjects', activity: '📖 Light flash-card review', hours: Math.min(1.5, dailyHours * 0.2) }]
      : sorted.map(s => ({ subject: s.name, activity: getWeeklyActivity(s, board, idx), hours: s.allocatedHours, difficulty: s.difficulty }));
    const totalHours = rows.reduce((t, r) => t + r.hours, 0);
    return { day, theme: DAY_THEMES[idx], rows, totalHours: Math.round(totalHours * 10) / 10, overloaded: totalHours > dailyHours * 1.1, isRest };
  });
}

function fmtDate(d) { return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }

function generateMonthlyOverview(subjects) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: 4 }, (_, w) => {
    const wStart = new Date(today); wStart.setDate(today.getDate() + w * 7);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate() + 6);
    const examsThisWeek = subjects.filter(s => {
      const d = new Date(s.examDate); d.setHours(0, 0, 0, 0);
      return d >= wStart && d <= wEnd;
    });
    const focus = examsThisWeek.length > 0
      ? `🎯 Exam Week: ${examsThisWeek.map(e => e.name).join(', ')}`
      : ['🚀 Intensive foundations + new topics', '📝 Practice problems + mock tests', '🔁 Revision cycles + weak topic focus', '✅ Final revision + relaxed review'][w];
    return {
      label: `Week ${w + 1}`,
      dateRange: `${fmtDate(wStart)} – ${fmtDate(wEnd)}`,
      focus,
      intensity: examsThisWeek.length > 0 ? 'high' : (w < 2 ? 'medium' : 'low'),
      exams: examsThisWeek.map(e => e.name)
    };
  });
}

function getBoardStrategy(board, weakSubject) {
  const base = {
    CBSE: [
      { icon: '📗', tip: 'Focus on NCERT — all exam questions originate from NCERT.' },
      { icon: '🔄', tip: 'Complete 3 NCERT revision cycles before mock tests.' },
      { icon: '📝', tip: 'Take weekly full-length mock tests under timed conditions.' },
      { icon: '🗂️', tip: 'Make chapter-wise formula/definition sheets after each unit.' }
    ],
    ICSE: [
      { icon: '✍️', tip: 'Practice long-answer writing — ICSE rewards detailed explanations.' },
      { icon: '📋', tip: 'Add dedicated answer-writing practice blocks daily.' },
      { icon: '📚', tip: 'Study both ICSE guide books AND reference materials.' },
      { icon: '⏱️', tip: 'Practice writing answers within 8–12 minute windows.' }
    ],
    'State Board': [
      { icon: '📋', tip: 'Solve the last 5 years of previous year papers (PYPs).' },
      { icon: '⭐', tip: 'Identify and master "important question" categories from guides.' },
      { icon: '📖', tip: 'Focus on state textbook — all marks come from it.' },
      { icon: '🔁', tip: 'Revise important questions at least 3 times before the exam.' }
    ],
    Other: [
      { icon: '🎯', tip: 'Identify the exam syllabus and mark high-weight topics first.' },
      { icon: '📝', tip: 'Solve past papers to understand question patterns.' },
      { icon: '🔁', tip: 'Revise notes using spaced repetition intervals.' },
      { icon: '💪', tip: 'Stay consistent — daily study always beats last-minute cramming.' }
    ]
  };
  const tips = [...(base[board] || base.Other)];
  if (weakSubject) tips.push({ icon: '⚠️', tip: `Weak subject detected: <strong>${weakSubject}</strong> — allocate 20% extra daily time and focus on it first each morning.` });
  return tips;
}

function getAITips(subjects, student) {
  const tips = [];
  const lowConf = subjects.filter(s => s.confidence === 'Low');
  const hardSubj = subjects.filter(s => s.difficulty === 'Hard');
  const urgentSub = subjects.filter(s => getDaysRemaining(s.examDate) <= 14);

  if (lowConf.length) tips.push({ icon: '🎯', text: `Low confidence in: ${lowConf.map(s => s.name).join(', ')}. Start each session with these — your brain is sharpest in the morning.` });
  if (hardSubj.length) tips.push({ icon: '🧩', text: `Hard subjects (${hardSubj.map(s => s.name).join(', ')}) need the Feynman technique: explain concepts aloud as if teaching someone.` });
  if (urgentSub.length) tips.push({ icon: '🚨', text: `URGENT: ${urgentSub.map(s => s.name).join(', ')} exam${urgentSub.length > 1 ? 's are' : ' is'} within 14 days! Switch to intensive revision mode immediately.` });

  if (student.targetPercentage >= 90) tips.push({ icon: '🏆', text: 'Targeting 90%+: Focus on conceptual clarity and application, not just rote memorization.' });
  else if (student.targetPercentage >= 75) tips.push({ icon: '📈', text: 'Targeting 75–89%: Balance concept coverage and practice. Solve at least 2 sample papers per subject.' });
  else tips.push({ icon: '✅', text: 'Focus on high-weight, frequently-asked topics first to secure passing marks comfortably.' });

  if (student.stream === 'Science') tips.push({ icon: '🧪', text: 'Prioritize diagrams, derivations, and numerical problems — biggest score-boosters.' });
  else if (student.stream === 'Commerce') tips.push({ icon: '💹', text: 'Practice journal entries and case studies daily. Time management in the exam hall is critical.' });
  else if (student.stream === 'Arts') tips.push({ icon: '🎨', text: 'Focus on structured essay writing, dates/timelines, and map-based questions for maximum marks.' });

  if (student.weakSubject) tips.push({ icon: '💡', text: `Weak subject (${student.weakSubject}): Use "3-2-1" method — 3 read-throughs, 2 practice exercises, 1 self-test every week.` });
  tips.push({ icon: '⏱️', text: 'Use Pomodoro sessions: 45 min deep focus → 10 min break. After 4 sessions, take a 30-minute long break.' });
  return tips;
}

function getRevisionAlerts(subjects) {
  return subjects.map(s => ({ ...s, days: getDaysRemaining(s.examDate) }))
    .filter(s => s.days > 0 && s.days <= 5)
    .sort((a, b) => a.days - b.days);
}

// ════════════════════════════════════════════════════════════════
//  UI RENDER MODULE
// ════════════════════════════════════════════════════════════════

function el(id) { return document.getElementById(id); }
function esc(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

const QUOTES = [
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Study while others are sleeping; work while others are loafing.", author: "William A. Ward" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" }
];

function renderStreak(s) {
  const p = el('streakPanel'); if (!p) return;
  const b = getStreakBadge(s.count);
  p.innerHTML = `<span class="streak-emoji">${b.emoji}</span><div class="streak-info"><span class="streak-count">${s.count} Day${s.count !== 1 ? 's' : ''}</span><span class="streak-label">Study Streak · ${b.label}</span></div>`;
}

function renderQuote() {
  const p = el('quotePanel'); if (!p) return;
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  p.innerHTML = `<div class="quote-icon">💬</div><blockquote class="quote-text">"${esc(q.text)}"</blockquote><cite class="quote-author">— ${esc(q.author)}</cite>`;
}

function diffBadge(d) { return { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }[d] || ''; }
function confBadge(c) { return { High: 'conf-high', Medium: 'conf-medium', Low: 'conf-low' }[c] || ''; }
function urgClass(days) { return days <= 7 ? 'urgent' : days <= 21 ? 'warning' : 'normal'; }

function renderPriorityRanking(allocated) {
  const p = el('priorityPanel'); if (!p) return;
  const sorted = [...allocated].sort((a, b) => b.score - a.score);
  p.innerHTML = sorted.map((s, i) => {
    const days = getDaysRemaining(s.examDate);
    const urg = urgClass(days);
    return `<div class="priority-item ${urg}" style="animation-delay:${i * .08}s">
      <div class="priority-rank">#${i + 1}</div>
      <div class="priority-body">
        <div class="priority-name">${esc(s.name)}</div>
        <div class="priority-meta">
          <span class="badge ${diffBadge(s.difficulty)}">${s.difficulty}</span>
          <span class="badge ${confBadge(s.confidence)}">Conf: ${s.confidence}</span>
          <span class="days-pill ${urg}">${days}d left</span>
        </div>
      </div>
      <div class="priority-score-wrap"><span class="priority-score">${s.score}</span><span class="priority-score-label">score</span></div>
    </div>`;
  }).join('');
}

function renderCountdowns(subjects) {
  const p = el('countdownPanel'); if (!p) return;
  const sorted = [...subjects].sort((a, b) => getDaysRemaining(a.examDate) - getDaysRemaining(b.examDate));
  p.innerHTML = sorted.map(s => {
    const days = getDaysRemaining(s.examDate);
    const urg = urgClass(days);
    const dateStr = new Date(s.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `<div class="countdown-chip ${urg}">
      <div class="cd-name">${esc(s.name)}</div>
      <div class="cd-number">${days}</div>
      <div class="cd-unit">days</div>
      <div class="cd-date">${dateStr}</div>
      ${days <= 3 ? '<div class="cd-alert">⚠️ Exam Very Close!</div>' : ''}
    </div>`;
  }).join('');
}

function renderDailyPlan(dailyPlan) {
  const p = el('dailyPlanPanel'); if (!p) return;
  if (!dailyPlan || !dailyPlan.length) { p.innerHTML = '<p class="empty-msg">No subjects added yet.</p>'; return; }
  p.innerHTML = `<div class="daily-timeline">${dailyPlan.map((item, i) => `
    <div class="timeline-item" style="animation-delay:${i * .1}s">
      <div class="timeline-time">${esc(item.time)}</div>
      <div class="timeline-dot"></div>
      <div class="timeline-body">
        <div class="timeline-subject">${esc(item.subject)}</div>
        <div class="timeline-activity">${esc(item.activity)}</div>
        <div class="timeline-hours">${item.hours}h</div>
      </div>
    </div>`).join('')}</div>`;
}

function renderWeeklyTimetable(weeklyData, subjects) {
  const p = el('weeklyPanel'); if (!p) return;
  const head = `<tr><th>Day</th><th>Theme</th>${subjects.map(s => `<th>${esc(s.name)}</th>`).join('')}<th>Total</th></tr>`;
  const body = weeklyData.map(row => {
    const cells = subjects.map(s => {
      const m = row.rows.find(r => r.subject === s.name);
      return m
        ? `<td><span class="activity-cell">${esc(m.activity)}</span><br><span class="hrs-cell">${m.hours}h</span></td>`
        : `<td><span class="rest-cell">—</span></td>`;
    }).join('');
    return `<tr class="${row.isRest ? 'rest-row' : ''} ${row.overloaded ? 'overloaded-row' : ''}">
      <td><span class="day-pill ${row.isRest ? 'rest-pill' : ''}">${row.day}</span></td>
      <td class="theme-cell">${row.theme}</td>
      ${cells}
      <td><span class="total-badge ${row.overloaded ? 'overloaded-badge' : ''}">${row.totalHours}h</span></td>
    </tr>`;
  }).join('');
  p.innerHTML = `<div class="table-wrapper"><table class="weekly-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>
    <div class="table-legend"><span class="legend-item">🔴 Overloaded day</span><span class="legend-item">🟢 Rest day</span></div>`;
}

function renderMonthlyOverview(monthly) {
  const p = el('monthlyPanel'); if (!p) return;
  p.innerHTML = monthly.map((w, i) => `
    <div class="month-week intensity-${w.intensity}" style="animation-delay:${i * .1}s">
      <div class="month-week-header">
        <span class="month-week-label">${w.label}</span>
        <span class="month-week-dates">${w.dateRange}</span>
        <span class="month-intensity-badge ${w.intensity}">${w.intensity.toUpperCase()}</span>
      </div>
      <div class="month-week-focus">${esc(w.focus)}</div>
      ${w.exams.length ? `<div class="month-exams">📌 Exam: ${w.exams.map(e => `<strong>${esc(e)}</strong>`).join(', ')}</div>` : ''}
    </div>`).join('');
}

function renderProgressBars(subjects) {
  const p = el('progressPanel'); if (!p) return;
  p.innerHTML = subjects.map((s, i) => {
    const pct = s.syllabusCompletion;
    const color = pct >= 75 ? '#2ecc71' : pct >= 40 ? '#f59e0b' : '#ef4444';
    const days = getDaysRemaining(s.examDate);
    return `<div class="progress-item" style="animation-delay:${i * .08}s">
      <div class="progress-header"><span class="progress-name">${esc(s.name)}</span><span class="progress-pct">${pct}%</span></div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:0%;background:${color}" data-target="${pct}"></div></div>
      <div class="progress-meta">
        <span class="badge ${diffBadge(s.difficulty)}">${s.difficulty}</span>
        <span class="badge ${confBadge(s.confidence)}">${s.confidence} conf</span>
        <span class="progress-days">${days}d remaining</span>
      </div>
    </div>`;
  }).join('');
  requestAnimationFrame(() => setTimeout(() => {
    p.querySelectorAll('.progress-bar-fill').forEach(b => { b.style.width = b.dataset.target + '%'; });
  }, 100));
}

function renderAITips(tips) {
  const p = el('tipsPanel'); if (!p) return;
  p.innerHTML = tips.map((t, i) => `<div class="tip-item" style="animation-delay:${i * .08}s"><span class="tip-icon">${t.icon}</span><span class="tip-text">${t.text}</span></div>`).join('');
}

function renderBoardStrategy(tips, board) {
  const p = el('boardStrategyPanel'); if (!p) return;
  p.innerHTML = `<div class="board-badge">📋 ${esc(board)} Strategy</div><div class="board-tips">${tips.map((t, i) => `<div class="tip-item" style="animation-delay:${i * .08}s"><span class="tip-icon">${t.icon}</span><span class="tip-text">${t.tip}</span></div>`).join('')
    }</div>`;
}

function renderRevisionAlerts(alerts) {
  const b = el('revisionAlertBanner'); if (!b) return;
  if (!alerts.length) { b.classList.add('hidden'); return; }
  b.classList.remove('hidden');
  b.innerHTML = `<span class="alert-icon">🚨</span><span class="alert-text"><strong>Revision Mode ON!</strong> ${alerts.map(a => `${esc(a.name)} in <strong>${a.days} day${a.days !== 1 ? 's' : ''}</strong>`).join(' · ')
    }</span>`;
}

// ─── SIDEBAR NAV ────────────────────────────────────────────────
function initSidebarNav() {
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');
  function activate(id) {
    sections.forEach(s => s.classList.toggle('active-section', s.id === id));
    links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
  }
  links.forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    activate(l.dataset.target);
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('open-overlay');
  }));
  if (sections.length) activate(sections[0].id);
}

function initMobileSidebar() {
  const toggle = el('sidebarToggle');
  const sidebar = el('sidebar');
  const overlay = el('sidebarOverlay');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('open-overlay');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open-overlay');
  });
}

// ─── SUBJECT CARD BUILDER ───────────────────────────────────────

let subjectCount = 0;

function addSubjectCard(container, data) {
  subjectCount++;
  const id = subjectCount;
  const today = new Date().toISOString().split('T')[0];
  const card = document.createElement('div');
  card.className = 'subject-card';
  card.dataset.id = id;
  card.innerHTML = `
    <div class="subject-card-header">
      <span class="subject-card-label">📘 Subject ${id}</span>
      <button type="button" class="remove-subject-btn" aria-label="Remove subject">✕</button>
    </div>
    <div class="subject-grid">
      <div class="form-group">
        <label>Subject Name</label>
        <input type="text" class="s-name" placeholder="e.g. Mathematics" value="${esc(data?.name || '')}" required />
      </div>
      <div class="form-group">
        <label>Difficulty</label>
        <select class="s-difficulty">
          <option value="Easy" ${data?.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
          <option value="Medium" ${(!data || data.difficulty === 'Medium') ? 'selected' : ''}>Medium</option>
          <option value="Hard" ${data?.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
        </select>
      </div>
      <div class="form-group">
        <label>Syllabus Completion (%)</label>
        <div class="range-group">
          <input type="range" class="s-syllabus" min="0" max="100" step="5" value="${data?.syllabusCompletion ?? 50}" />
          <span class="range-value">${data?.syllabusCompletion ?? 50}%</span>
        </div>
      </div>
      <div class="form-group">
        <label>Exam Date</label>
        <input type="date" class="s-date" min="${today}" value="${data?.examDate || ''}" required />
      </div>
      <div class="form-group">
        <label>Confidence Level</label>
        <select class="s-confidence">
          <option value="Low" ${data?.confidence === 'Low' ? 'selected' : ''}>Low</option>
          <option value="Medium" ${(!data || data.confidence === 'Medium') ? 'selected' : ''}>Medium</option>
          <option value="High" ${data?.confidence === 'High' ? 'selected' : ''}>High</option>
        </select>
      </div>
    </div>`;
  const range = card.querySelector('.s-syllabus');
  const val = card.querySelector('.range-value');
  range.addEventListener('input', () => val.textContent = range.value + '%');
  card.querySelector('.remove-subject-btn').addEventListener('click', () => {
    card.remove();
    renumberSubjects();
  });
  container.appendChild(card);
  return card;
}

function renumberSubjects() {
  document.querySelectorAll('.subject-card').forEach((c, i) => {
    const lbl = c.querySelector('.subject-card-label');
    if (lbl) lbl.textContent = `📘 Subject ${i + 1}`;
  });
}

function collectSubjects(container) {
  const cards = container.querySelectorAll('.subject-card');
  if (!cards.length) return null;
  let valid = true;
  const subjects = [];
  cards.forEach(card => {
    const name = card.querySelector('.s-name').value.trim();
    const examDate = card.querySelector('.s-date').value;
    if (!name || !examDate) { valid = false; card.classList.add('card-error'); }
    else {
      card.classList.remove('card-error');
      subjects.push({
        name,
        difficulty: card.querySelector('.s-difficulty').value,
        syllabusCompletion: parseInt(card.querySelector('.s-syllabus').value, 10),
        examDate,
        confidence: card.querySelector('.s-confidence').value
      });
    }
  });
  return valid ? subjects : null;
}

// ════════════════════════════════════════════════════════════════
//  APP ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

function collectStudentData() {
  const name = el('studentName')?.value.trim();
  if (!name) {
    el('studentName')?.classList.add('invalid');
    el('nameError')?.classList.add('visible');
    return null;
  }
  el('studentName')?.classList.remove('invalid');
  el('nameError')?.classList.remove('visible');
  return {
    name,
    cls: el('studentClass')?.value || '12th',
    board: el('studentBoard')?.value || 'CBSE',
    stream: el('studentStream')?.value || 'Science',
    targetPercentage: parseInt(el('targetPercentage')?.value || '75', 10),
    dailyHours: parseFloat(el('dailyHours')?.value || '5'),
    weakSubject: el('weakSubject')?.value.trim() || '',
    strongSubject: el('strongSubject')?.value.trim() || ''
  };
}

function generateAndRender(student, subjects) {
  const { board, dailyHours } = student;
  const allocated = allocateHours(subjects, dailyHours);
  const dailyPlan = generateDailyPlan(subjects, dailyHours, board);
  const weeklyData = generateWeeklyTimetable(subjects, dailyHours, board);
  const monthly = generateMonthlyOverview(subjects);
  const boardTips = getBoardStrategy(board, student.weakSubject);
  const aiTips = getAITips(subjects, student);
  const revAlerts = getRevisionAlerts(subjects);

  const nameEl = el('dashStudentName');
  if (nameEl) nameEl.textContent = student.name;

  renderRevisionAlerts(revAlerts);
  renderPriorityRanking(allocated);
  renderCountdowns(subjects);
  renderDailyPlan(dailyPlan);
  renderWeeklyTimetable(weeklyData, subjects);
  renderMonthlyOverview(monthly);
  renderProgressBars(subjects);
  renderAITips(aiTips);
  renderBoardStrategy(boardTips, board);
  renderQuote();
}

function showDashboard() {
  el('formView')?.classList.add('hidden');
  el('dashboardView')?.classList.remove('hidden');
  document.querySelector('[data-target="section-priority"]')?.click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPlanner() {
  el('dashboardView')?.classList.add('hidden');
  el('formView')?.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
  const icon = el('themeIcon');
  const label = el('themeLabel');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

function prefillStudentForm(d) {
  const set = (id, v) => { const e = el(id); if (e) e.value = v; };
  set('studentName', d.name || '');
  set('studentClass', d.cls || '12th');
  set('studentBoard', d.board || 'CBSE');
  set('studentStream', d.stream || 'Science');
  set('targetPercentage', d.targetPercentage || 75);
  set('dailyHours', d.dailyHours || 5);
  set('weakSubject', d.weakSubject || '');
  set('strongSubject', d.strongSubject || '');
}

// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const fyEl = el('footerYear');
  if (fyEl) fyEl.textContent = new Date().getFullYear();

  applyTheme(loadTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  renderStreak(updateStreak());
  initSidebarNav();
  initMobileSidebar();

  const savedStudent = loadStudent();
  const savedSubjects = loadSubjects();

  if (savedStudent && savedSubjects.length) {
    prefillStudentForm(savedStudent);
    const container = el('subjectsContainer');
    container.innerHTML = '';
    savedSubjects.forEach(s => addSubjectCard(container, s));
    generateAndRender(savedStudent, savedSubjects);
    showDashboard();
  } else {
    addSubjectCard(el('subjectsContainer'));
    showPlanner();
  }

  el('addSubjectBtn')?.addEventListener('click', () => addSubjectCard(el('subjectsContainer')));

  el('plannerForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const student = collectStudentData();
    if (!student) return;
    const subjects = collectSubjects(el('subjectsContainer'));
    if (!subjects || !subjects.length) { alert('Please add at least one subject with a name and exam date.'); return; }
    const bad = subjects.find(s => getDaysRemaining(s.examDate) < 1);
    if (bad) { alert(`Exam date for "${bad.name}" must be in the future.`); return; }
    saveStudent(student);
    saveSubjects(subjects);
    generateAndRender(student, subjects);
    showDashboard();
  });

  el('resetBtn')?.addEventListener('click', () => {
    if (!confirm('Reset your study plan and start over?')) return;
    clearAll();
    el('plannerForm')?.reset();
    el('subjectsContainer').innerHTML = '';
    subjectCount = 0;
    addSubjectCard(el('subjectsContainer'));
    showPlanner();
    applyTheme('light');
  });

  el('themeToggle')?.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
});

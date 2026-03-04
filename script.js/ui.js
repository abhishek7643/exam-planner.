/* =========================================
   AI SMART MULTI-EXAM STRATEGY PLANNER
   UI Rendering Module — ui.js
   ========================================= */

'use strict';

import { getDaysRemaining } from './ai.js';
import { getStreakBadge } from './streak.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

function difficultyColor(d) {
    return { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }[d] || '';
}

function confColor(c) {
    return { High: 'conf-high', Medium: 'conf-medium', Low: 'conf-low' }[c] || '';
}

function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// ─── STREAK PANEL ─────────────────────────────────────────────────────────────

export function renderStreak(streakData) {
    const panel = el('streakPanel');
    if (!panel) return;
    const badge = getStreakBadge(streakData.count);
    panel.innerHTML = `
    <span class="streak-emoji">${badge.emoji}</span>
    <div class="streak-info">
      <span class="streak-count">${streakData.count} Day${streakData.count !== 1 ? 's' : ''}</span>
      <span class="streak-label">Study Streak · ${badge.label}</span>
    </div>
  `;
}

// ─── MOTIVATIONAL QUOTE ────────────────────────────────────────────────────────

const QUOTES = [
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Anonymous" },
    { text: "Study while others are sleeping; work while others are loafing.", author: "William A. Ward" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
];

export function renderQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const panel = el('quotePanel');
    if (!panel) return;
    panel.innerHTML = `
    <div class="quote-icon">💬</div>
    <blockquote class="quote-text">"${htmlEscape(q.text)}"</blockquote>
    <cite class="quote-author">— ${htmlEscape(q.author)}</cite>
  `;
}

// ─── PRIORITY RANKING ─────────────────────────────────────────────────────────

export function renderPriorityRanking(allocatedSubjects) {
    const panel = el('priorityPanel');
    if (!panel) return;

    const sorted = [...allocatedSubjects].sort((a, b) => b.score - a.score);

    panel.innerHTML = sorted.map((s, i) => {
        const days = getDaysRemaining(s.examDate);
        const urgency = days <= 7 ? 'urgent' : days <= 21 ? 'warning' : 'normal';
        return `
      <div class="priority-item ${urgency}" style="animation-delay:${i * 0.08}s">
        <div class="priority-rank">#${i + 1}</div>
        <div class="priority-body">
          <div class="priority-name">${htmlEscape(s.name)}</div>
          <div class="priority-meta">
            <span class="badge ${difficultyColor(s.difficulty)}">${s.difficulty}</span>
            <span class="badge ${confColor(s.confidence)}">Conf: ${s.confidence}</span>
            <span class="days-pill ${urgency}">${days}d left</span>
          </div>
        </div>
        <div class="priority-score-wrap">
          <span class="priority-score">${s.score}</span>
          <span class="priority-score-label">score</span>
        </div>
      </div>
    `;
    }).join('');
}

// ─── COUNTDOWN TIMERS ─────────────────────────────────────────────────────────

export function renderCountdowns(subjects) {
    const panel = el('countdownPanel');
    if (!panel) return;

    const sorted = [...subjects].sort((a, b) =>
        getDaysRemaining(a.examDate) - getDaysRemaining(b.examDate)
    );

    panel.innerHTML = sorted.map(s => {
        const days = getDaysRemaining(s.examDate);
        const urgency = days <= 7 ? 'urgent' : days <= 21 ? 'warning' : 'normal';
        const hours = Math.floor(days * 24);
        const examDateFmt = new Date(s.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `
      <div class="countdown-chip ${urgency}">
        <div class="cd-name">${htmlEscape(s.name)}</div>
        <div class="cd-number">${days}</div>
        <div class="cd-unit">days</div>
        <div class="cd-date">${examDateFmt}</div>
        ${days <= 3 ? '<div class="cd-alert">⚠️ Exam Very Close!</div>' : ''}
      </div>
    `;
    }).join('');
}

// ─── DAILY STUDY PLAN ─────────────────────────────────────────────────────────

export function renderDailyPlan(dailyPlan) {
    const panel = el('dailyPlanPanel');
    if (!panel) return;

    if (!dailyPlan || dailyPlan.length === 0) {
        panel.innerHTML = '<p class="empty-msg">No subjects added yet.</p>';
        return;
    }

    panel.innerHTML = `
    <div class="daily-timeline">
      ${dailyPlan.map((item, i) => `
        <div class="timeline-item" style="animation-delay:${i * 0.1}s">
          <div class="timeline-time">${htmlEscape(item.time)}</div>
          <div class="timeline-dot"></div>
          <div class="timeline-body">
            <div class="timeline-subject">${htmlEscape(item.subject)}</div>
            <div class="timeline-activity">${htmlEscape(item.activity)}</div>
            <div class="timeline-hours">${item.hours}h</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── WEEKLY TIMETABLE ─────────────────────────────────────────────────────────

export function renderWeeklyTimetable(weeklyData, subjects) {
    const panel = el('weeklyPanel');
    if (!panel) return;

    const subjectNames = subjects.map(s => s.name);

    const tableHead = `
    <tr>
      <th>Day</th>
      <th>Theme</th>
      ${subjectNames.map(n => `<th>${htmlEscape(n)}</th>`).join('')}
      <th>Total Hrs</th>
    </tr>
  `;

    const tableBody = weeklyData.map(row => {
        const subjectCells = subjects.map(s => {
            const match = row.rows.find(r => r.subject === s.name);
            return `<td>${match ? `<span class="activity-cell">${htmlEscape(match.activity)}</span><br><span class="hrs-cell">${match.hours}h</span>` : '<span class="rest-cell">—</span>'}</td>`;
        }).join('');

        return `
      <tr class="${row.isRest ? 'rest-row' : ''} ${row.overloaded ? 'overloaded-row' : ''}">
        <td><span class="day-pill ${row.isRest ? 'rest-pill' : ''}">${row.day}</span></td>
        <td class="theme-cell">${row.theme}</td>
        ${subjectCells}
        <td><span class="total-badge ${row.overloaded ? 'overloaded-badge' : ''}">${row.totalHours}h</span></td>
      </tr>
    `;
    }).join('');

    panel.innerHTML = `
    <div class="table-wrapper">
      <table class="weekly-table">
        <thead>${tableHead}</thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
    <div class="table-legend">
      <span class="legend-item overloaded-legend">🔴 Overloaded day</span>
      <span class="legend-item rest-legend">🟢 Rest day</span>
    </div>
  `;
}

// ─── MONTHLY OVERVIEW ─────────────────────────────────────────────────────────

export function renderMonthlyOverview(monthlyData) {
    const panel = el('monthlyPanel');
    if (!panel) return;

    panel.innerHTML = monthlyData.map((week, i) => `
    <div class="month-week intensity-${week.intensity}" style="animation-delay:${i * 0.1}s">
      <div class="month-week-header">
        <span class="month-week-label">${week.label}</span>
        <span class="month-week-dates">${week.dateRange}</span>
        <span class="month-intensity-badge ${week.intensity}">${week.intensity.toUpperCase()}</span>
      </div>
      <div class="month-week-focus">${htmlEscape(week.focus)}</div>
      ${week.exams.length > 0 ? `<div class="month-exams">📌 Exam: ${week.exams.map(e => `<strong>${htmlEscape(e)}</strong>`).join(', ')}</div>` : ''}
    </div>
  `).join('');
}

// ─── PROGRESS BARS ────────────────────────────────────────────────────────────

export function renderProgressBars(subjects) {
    const panel = el('progressPanel');
    if (!panel) return;

    panel.innerHTML = subjects.map((s, i) => {
        const pct = s.syllabusCompletion;
        const color = pct >= 75 ? '#2ecc71' : pct >= 40 ? '#f39c12' : '#e74c3c';
        const days = getDaysRemaining(s.examDate);
        return `
      <div class="progress-item" style="animation-delay:${i * 0.08}s">
        <div class="progress-header">
          <span class="progress-name">${htmlEscape(s.name)}</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:0%; background:${color}" data-target="${pct}"></div>
        </div>
        <div class="progress-meta">
          <span class="badge ${difficultyColor(s.difficulty)}">${s.difficulty}</span>
          <span class="badge ${confColor(s.confidence)}">${s.confidence} conf</span>
          <span class="progress-days">${days}d remaining</span>
        </div>
      </div>
    `;
    }).join('');

    // Animate bars after paint
    requestAnimationFrame(() => {
        setTimeout(() => {
            panel.querySelectorAll('.progress-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 100);
    });
}

// ─── AI TIPS ─────────────────────────────────────────────────────────────────

export function renderAITips(tips) {
    const panel = el('tipsPanel');
    if (!panel) return;

    panel.innerHTML = tips.map((t, i) => `
    <div class="tip-item" style="animation-delay:${i * 0.08}s">
      <span class="tip-icon">${t.icon}</span>
      <span class="tip-text">${t.text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</span>
    </div>
  `).join('');
}

// ─── BOARD STRATEGY ───────────────────────────────────────────────────────────

export function renderBoardStrategy(tips, board) {
    const panel = el('boardStrategyPanel');
    if (!panel) return;

    panel.innerHTML = `
    <div class="board-badge">📋 ${board} Strategy</div>
    <div class="board-tips">
      ${tips.map((t, i) => `
        <div class="tip-item" style="animation-delay:${i * 0.08}s">
          <span class="tip-icon">${t.icon}</span>
          <span class="tip-text">${t.tip.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── REVISION ALERTS ──────────────────────────────────────────────────────────

export function renderRevisionAlerts(alerts) {
    const banner = el('revisionAlertBanner');
    if (!banner) return;

    if (alerts.length === 0) {
        banner.classList.add('hidden');
        return;
    }

    banner.classList.remove('hidden');
    banner.innerHTML = `
    <span class="alert-icon">🚨</span>
    <span class="alert-text">
      <strong>Revision Mode ON!</strong>
      ${alerts.map(a => `${a.name} in <strong>${a.days} day${a.days !== 1 ? 's' : ''}</strong>`).join(' · ')}
    </span>
  `;
}

// ─── SIDEBAR NAV ACTIVE STATE ────────────────────────────────────────────────

export function initSidebarNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    function activateSection(targetId) {
        sections.forEach(s => s.classList.toggle('active-section', s.id === targetId));
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.target === targetId));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            activateSection(link.dataset.target);
            // Close mobile sidebar if open
            document.getElementById('sidebar')?.classList.remove('open');
        });
    });

    // Activate first section by default
    if (sections.length > 0) activateSection(sections[0].id);
}

// ─── MOBILE SIDEBAR TOGGLE ────────────────────────────────────────────────────

export function initMobileSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    overlay?.addEventListener('click', () => sidebar.classList.remove('open'));
}

// ─── SUBJECT CARD BUILDER (Form) ─────────────────────────────────────────────

let subjectCount = 0;

export function addSubjectCard(container, data = null) {
    subjectCount++;
    const id = subjectCount;
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.dataset.id = id;

    const today = new Date().toISOString().split('T')[0];

    card.innerHTML = `
    <div class="subject-card-header">
      <span class="subject-card-label">📘 Subject ${id}</span>
      <button type="button" class="remove-subject-btn" aria-label="Remove subject" onclick="this.closest('.subject-card').remove(); updateSubjectNumbers()">✕</button>
    </div>
    <div class="subject-grid">
      <div class="form-group">
        <label>Subject Name</label>
        <input type="text" class="s-name" placeholder="e.g. Mathematics" value="${data?.name || ''}" required />
      </div>
      <div class="form-group">
        <label>Difficulty</label>
        <select class="s-difficulty">
          <option value="Easy" ${data?.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
          <option value="Medium" ${!data || data.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
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
          <option value="Medium" ${!data || data.confidence === 'Medium' ? 'selected' : ''}>Medium</option>
          <option value="High" ${data?.confidence === 'High' ? 'selected' : ''}>High</option>
        </select>
      </div>
    </div>
  `;

    // Wire range slider live update
    const rangeEl = card.querySelector('.s-syllabus');
    const rangeVal = card.querySelector('.range-value');
    rangeEl.addEventListener('input', () => rangeVal.textContent = rangeEl.value + '%');

    container.appendChild(card);
    return card;
}

export function collectSubjects(container) {
    const cards = container.querySelectorAll('.subject-card');
    const subjects = [];
    let valid = true;

    cards.forEach(card => {
        const name = card.querySelector('.s-name').value.trim();
        const difficulty = card.querySelector('.s-difficulty').value;
        const syllabusCompletion = parseInt(card.querySelector('.s-syllabus').value, 10);
        const examDate = card.querySelector('.s-date').value;
        const confidence = card.querySelector('.s-confidence').value;

        if (!name || !examDate) {
            valid = false;
            card.classList.add('card-error');
        } else {
            card.classList.remove('card-error');
            subjects.push({ name, difficulty, syllabusCompletion, examDate, confidence });
        }
    });

    return valid ? subjects : null;
}

/* =========================================
   AI SMART MULTI-EXAM STRATEGY PLANNER
   AI Logic Module — ai.js
   ========================================= */

'use strict';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DIFFICULTY_WEIGHT = { Easy: 1, Medium: 2, Hard: 3 };
const CONFIDENCE_WEIGHT = { High: 1, Medium: 2, Low: 3 };

// ─── PRIORITY SCORE ENGINE ────────────────────────────────────────────────────

/**
 * Calculate a priority score for each subject.
 * Higher = study this first.
 * Formula:
 *   urgency (max 40) + difficulty (max 25) + syllabus remaining (max 25) + confidence bonus (max 10)
 */
export function calcPriorityScore(subject) {
    const days = getDaysRemaining(subject.examDate);
    const safeDay = Math.max(days, 1);

    // Urgency: 1-day exam = 40 pts, scaling down logarithmically
    const urgency = Math.min(40, Math.round(40 / Math.log2(safeDay + 1)));

    // Difficulty
    const difficulty = (DIFFICULTY_WEIGHT[subject.difficulty] / 3) * 25;

    // Remaining syllabus
    const remaining = ((100 - subject.syllabusCompletion) / 100) * 25;

    // Confidence bonus
    const confidence = (CONFIDENCE_WEIGHT[subject.confidence] / 3) * 10;

    return Math.round(urgency + difficulty + remaining + confidence);
}

// ─── DAYS REMAINING ──────────────────────────────────────────────────────────

export function getDaysRemaining(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(dateStr);
    exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
}

// ─── HOUR ALLOCATION ENGINE ───────────────────────────────────────────────────

/**
 * Distribute daily available hours across subjects
 * proportional to their priority score, then round to 0.5 increments.
 * Respects the daily cap.
 */
export function allocateHours(subjects, dailyHours) {
    const scored = subjects.map(s => ({
        ...s,
        score: calcPriorityScore(s),
        days: getDaysRemaining(s.examDate)
    }));

    const totalScore = scored.reduce((sum, s) => sum + s.score, 0) || 1;

    return scored.map(s => {
        let raw = (s.score / totalScore) * dailyHours;
        // Round to nearest 0.5
        raw = Math.round(raw * 2) / 2;
        // At least 0.5h for any subject; at most 70% of daily hours for one subject
        raw = Math.max(0.5, Math.min(raw, dailyHours * 0.7));
        return { ...s, allocatedHours: raw };
    });
}

// ─── DAILY STUDY PLAN ─────────────────────────────────────────────────────────

/**
 * Generate a daily study plan for today (one day's schedule).
 * Returns array of { time, subject, activity, hours }
 */
export function generateDailyPlan(subjects, dailyHours, board) {
    const allocated = allocateHours(subjects, dailyHours);
    const plan = [];
    let hour = 8; // Start study at 8 AM

    // Sort by priority descending (hardest/most urgent first)
    const sorted = [...allocated].sort((a, b) => b.score - a.score);

    sorted.forEach(s => {
        const h = s.allocatedHours;
        const startTime = formatTime(hour);
        hour += h;
        const endTime = formatTime(hour);
        plan.push({
            time: `${startTime} – ${endTime}`,
            subject: s.name,
            activity: getDailyActivity(s, board),
            hours: h,
            difficulty: s.difficulty,
            confidence: s.confidence,
            daysLeft: s.days
        });
        // 15-min break added
        hour += 0.25;
    });

    return plan;
}

function getDailyActivity(subject, board) {
    const { difficulty, confidence, syllabusCompletion } = subject;

    if (syllabusCompletion < 40) {
        return '📖 Learn New Topics + Note-taking';
    }
    if (confidence === 'Low') {
        if (board === 'ICSE') return '✍️ Answer Writing + Long Answer Practice';
        if (board === 'State Board') return '📋 Prev Year Papers + Important Questions';
        return '🔁 Deep Revision + Practice Problems';
    }
    if (difficulty === 'Hard') {
        return '🧩 Concept Mastery + Solved Examples';
    }
    if (board === 'CBSE') return '📗 NCERT Revision + Mock Test Prep';
    return '✅ Revision + Flash Cards';
}

function formatTime(decimalHour) {
    const h = Math.floor(decimalHour);
    const m = Math.round((decimalHour - h) * 60);
    const suffix = h < 12 ? 'AM' : 'PM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ─── WEEKLY TIMETABLE GENERATOR ──────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_THEMES = [
    'Core Concepts',
    'Practice & Exercises',
    'Deep Dive / Weak Topics',
    'Mock Test / Assessment',
    'Revision & Summaries',
    'Catchup + Previous Papers',
    'Rest & Light Review'
];

export function generateWeeklyTimetable(subjects, dailyHours, board) {
    const allocated = allocateHours(subjects, dailyHours);
    const sorted = [...allocated].sort((a, b) => b.score - a.score);

    return DAYS.map((day, idx) => {
        const isRest = idx === 6;
        const theme = DAY_THEMES[idx];
        const rows = isRest
            ? [{ subject: 'All Subjects', activity: '📖 Light flash-card review + rest', hours: Math.min(1.5, dailyHours * 0.2) }]
            : sorted.map(s => ({
                subject: s.name,
                activity: getWeeklyActivity(s, board, idx),
                hours: s.allocatedHours,
                difficulty: s.difficulty
            }));

        const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);
        const overloaded = totalHours > dailyHours * 1.1;

        return { day, theme, rows, totalHours: Math.round(totalHours * 10) / 10, overloaded, isRest };
    });
}

function getWeeklyActivity(subject, board, dayIndex) {
    const boardActivities = {
        CBSE: ['NCERT Reading', 'NCERT Exercises', 'Exemplar Problems', 'Mock Test', 'NCERT Revision', 'Full Mock Paper', 'Light Review'],
        ICSE: ['Theory Study', 'Answer Writing', 'Long Answers Drill', 'Essay Practice', 'Revision', 'Previous Papers', 'Light Review'],
        'State Board': ['Chapter Study', 'Important Questions', 'PYQ Practice', 'Full Paper', 'Key Points Revision', 'Imp. Q Revision', 'Rest'],
        Other: ['Study', 'Practice', 'Deep Dive', 'Test', 'Revision', 'Past Papers', 'Rest']
    };
    const activities = boardActivities[board] || boardActivities.Other;
    return activities[dayIndex] || 'Study';
}

// ─── MONTHLY OVERVIEW GENERATOR ──────────────────────────────────────────────

export function generateMonthlyOverview(subjects, dailyHours) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weeks = [];

    for (let w = 0; w < 4; w++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Find exams landing in this week
        const examsThisWeek = subjects.filter(s => {
            const d = new Date(s.examDate);
            d.setHours(0, 0, 0, 0);
            return d >= weekStart && d <= weekEnd;
        });

        const focus = examsThisWeek.length > 0
            ? `🎯 Exam Week: ${examsThisWeek.map(e => e.name).join(', ')}`
            : w === 0
                ? '🚀 Intensive foundations + new topics'
                : w === 1
                    ? '📝 Practice problems + mock tests'
                    : w === 2
                        ? '🔁 Revision cycles + weak topic focus'
                        : '✅ Final revision + relaxed review';

        const intensity = examsThisWeek.length > 0 ? 'high' : (w < 2 ? 'medium' : 'low');

        weeks.push({
            label: `Week ${w + 1}`,
            dateRange: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
            focus,
            intensity,
            exams: examsThisWeek.map(e => e.name)
        });
    }

    return weeks;
}

function formatDate(d) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── BOARD-SPECIFIC STRATEGY ─────────────────────────────────────────────────

export function getBoardStrategy(board, weakSubject) {
    const base = {
        CBSE: [
            { icon: '📗', tip: 'Focus on NCERT — all exam questions originate from NCERT.' },
            { icon: '🔄', tip: 'Complete 3 NCERT revision cycles before mock tests.' },
            { icon: '📝', tip: 'Take weekly full-length mock tests under timed conditions.' },
            { icon: '🗂️', tip: 'Make chapter-wise formula/definition sheets after each unit.' },
        ],
        ICSE: [
            { icon: '✍️', tip: 'Practice long-answer writing — ICSE rewards detailed explanations.' },
            { icon: '📋', tip: 'Add dedicated answer-writing practice blocks daily.' },
            { icon: '📚', tip: 'Study both ICSE guide books AND reference materials.' },
            { icon: '⏱️', tip: 'Practice writing answers within 8–12 minute windows.' },
        ],
        'State Board': [
            { icon: '📋', tip: 'Solve the last 5 years of previous year papers (PYPs).' },
            { icon: '⭐', tip: 'Identify and master "important question" categories from guides.' },
            { icon: '📖', tip: 'Focus on state textbook — all marks come from it.' },
            { icon: '🔁', tip: 'Revise important questions at least 3 times before the exam.' },
        ],
        Other: [
            { icon: '🎯', tip: 'Identify the exam syllabus and mark high-weight topics first.' },
            { icon: '📝', tip: 'Solve past papers to understand question patterns.' },
            { icon: '🔁', tip: 'Revise notes using spaced repetition intervals.' },
            { icon: '💪', tip: 'Stay consistent — daily study always beats last-minute cramming.' },
        ]
    };

    const tips = [...(base[board] || base.Other)];

    if (weakSubject) {
        tips.push({ icon: '⚠️', tip: `Weak subject detected: **${weakSubject}** — allocate 20% extra daily time and focus on it first each morning.` });
    }

    return tips;
}

// ─── SMART AI TIPS ────────────────────────────────────────────────────────────

export function getAITips(subjects, student) {
    const tips = [];
    const lowConf = subjects.filter(s => s.confidence === 'Low');
    const hardSubj = subjects.filter(s => s.difficulty === 'Hard');
    const urgentSubj = subjects.filter(s => getDaysRemaining(s.examDate) <= 14);

    if (lowConf.length > 0) {
        tips.push({ icon: '🎯', text: `Low confidence in: ${lowConf.map(s => s.name).join(', ')}. Start each session with these — your brain is sharpest in the morning.` });
    }
    if (hardSubj.length > 0) {
        tips.push({ icon: '🧩', text: `Hard subjects (${hardSubj.map(s => s.name).join(', ')}) need the Feynman technique: explain concepts aloud as if teaching someone.` });
    }
    if (urgentSubj.length > 0) {
        tips.push({ icon: '🚨', text: `URGENT: ${urgentSubj.map(s => s.name).join(', ')} exam${urgentSubj.length > 1 ? 's are' : ' is'} within 14 days! Switch to intensive revision mode immediately.` });
    }

    // Target percentage tips
    if (student.targetPercentage >= 90) {
        tips.push({ icon: '🏆', text: 'Targeting 90%+: You need thorough understanding, not just rote memorization. Focus on conceptual clarity and application.' });
    } else if (student.targetPercentage >= 75) {
        tips.push({ icon: '📈', text: 'Targeting 75–89%: Balance between concept coverage and practice. Solve at least 2 sample papers per subject.' });
    } else {
        tips.push({ icon: '✅', text: 'Focus on high-weight, frequently-asked topics first to secure passing marks comfortably.' });
    }

    // Stream-specific
    if (student.stream === 'Science') {
        tips.push({ icon: '🧪', text: 'Science students: Prioritize diagrams, derivations, and numerical problems. These are the biggest score-boosters.' });
    } else if (student.stream === 'Commerce') {
        tips.push({ icon: '💹', text: 'Commerce students: Practice journal entries and case studies daily. Time management in the exam hall is critical.' });
    } else if (student.stream === 'Arts') {
        tips.push({ icon: '🎨', text: 'Arts students: Focus on structured essay writing, dates/timelines, and map-based questions for maximum marks.' });
    }

    if (student.weakSubject) {
        tips.push({ icon: '💡', text: `Weak subject (${student.weakSubject}): Use the "3-2-1" method — 3 read-throughs, 2 practice exercises, 1 self-test every week.` });
    }

    // Pomodoro generic tip
    tips.push({ icon: '⏱️', text: 'Use Pomodoro sessions: 45 min deep focus → 10 min break. After 4 sessions, take a 30-minute long break.' });

    return tips;
}

// ─── REVISION DAYS CALCULATOR ─────────────────────────────────────────────────

/**
 * Returns subjects that need revision days flagged (exam within 5 days).
 */
export function getRevisionAlerts(subjects) {
    return subjects
        .map(s => ({ ...s, days: getDaysRemaining(s.examDate) }))
        .filter(s => s.days > 0 && s.days <= 5)
        .sort((a, b) => a.days - b.days);
}

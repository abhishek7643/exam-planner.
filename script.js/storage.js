/* =========================================
   AI SMART MULTI-EXAM STRATEGY PLANNER
   LocalStorage Module — storage.js
   ========================================= */

'use strict';

const KEYS = {
    STUDENT: 'aiPlanner_student',
    SUBJECTS: 'aiPlanner_subjects',
    STREAK: 'aiPlanner_streak',
    THEME: 'aiPlanner_theme',
    PLAN_DATE: 'aiPlanner_planDate'
};

export function saveStudent(data) {
    localStorage.setItem(KEYS.STUDENT, JSON.stringify(data));
}

export function loadStudent() {
    try { return JSON.parse(localStorage.getItem(KEYS.STUDENT)) || null; }
    catch { return null; }
}

export function saveSubjects(data) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(data));
}

export function loadSubjects() {
    try { return JSON.parse(localStorage.getItem(KEYS.SUBJECTS)) || []; }
    catch { return []; }
}

export function saveStreak(data) {
    localStorage.setItem(KEYS.STREAK, JSON.stringify(data));
}

export function loadStreak() {
    try { return JSON.parse(localStorage.getItem(KEYS.STREAK)) || { count: 0, lastDate: null }; }
    catch { return { count: 0, lastDate: null }; }
}

export function saveTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
}

export function loadTheme() {
    return localStorage.getItem(KEYS.THEME) || null;
}

export function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

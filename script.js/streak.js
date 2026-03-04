/* =========================================
   AI SMART MULTI-EXAM STRATEGY PLANNER
   Study Streak Tracker — streak.js
   ========================================= */

'use strict';

import { saveStreak, loadStreak } from './storage.js';

/**
 * Call once per page load to check/update the streak.
 * Returns the current streak object { count, lastDate }.
 */
export function updateStreak() {
    const stored = loadStreak();
    const todayStr = new Date().toISOString().split('T')[0];

    if (stored.lastDate === todayStr) {
        // Already visited today — keep streak as is
        return stored;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCount;
    if (stored.lastDate === yesterdayStr) {
        // Consecutive day
        newCount = stored.count + 1;
    } else {
        // Streak broken or first time
        newCount = 1;
    }

    const updated = { count: newCount, lastDate: todayStr };
    saveStreak(updated);
    return updated;
}

/**
 * Returns a flame emoji string based on streak length.
 */
export function getStreakBadge(count) {
    if (count >= 30) return { emoji: '🔥🔥🔥', label: 'Legendary' };
    if (count >= 14) return { emoji: '🔥🔥', label: 'On Fire' };
    if (count >= 7) return { emoji: '🔥', label: 'Hot Streak' };
    if (count >= 3) return { emoji: '⚡', label: 'Building Up' };
    return { emoji: '✨', label: 'Just Started' };
}

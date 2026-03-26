export const XP_PER_LESSON = 25;
export const STREAK_BONUS_XP = 15;

export interface UserStats {
  completedLessons: number;
  completedCourses: number;
  currentStreak: number;
  lessonsToday: number;
  totalXp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: (stats: UserStats) => boolean;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  FIRST_LESSON: {
    id: 'FIRST_LESSON',
    title: 'Первый шаг',
    description: 'Завершите свой первый урок',
    icon: '🎯',
    xpReward: 50,
    condition: (stats) => stats.completedLessons >= 1,
  },
  LESSONS_5: {
    id: 'LESSONS_5',
    title: 'Набираю темп',
    description: 'Завершите 5 уроков',
    icon: '🔥',
    xpReward: 75,
    condition: (stats) => stats.completedLessons >= 5,
  },
  LESSONS_10: {
    id: 'LESSONS_10',
    title: 'Десяточка',
    description: 'Завершите 10 уроков',
    icon: '⭐',
    xpReward: 100,
    condition: (stats) => stats.completedLessons >= 10,
  },
  LESSONS_25: {
    id: 'LESSONS_25',
    title: 'Четверть сотни',
    description: 'Завершите 25 уроков',
    icon: '💪',
    xpReward: 150,
    condition: (stats) => stats.completedLessons >= 25,
  },
  LESSONS_50: {
    id: 'LESSONS_50',
    title: 'Полсотни',
    description: 'Завершите 50 уроков',
    icon: '🏆',
    xpReward: 250,
    condition: (stats) => stats.completedLessons >= 50,
  },
  FIRST_COURSE: {
    id: 'FIRST_COURSE',
    title: 'Выпускник',
    description: 'Завершите первый курс',
    icon: '🎓',
    xpReward: 200,
    condition: (stats) => stats.completedCourses >= 1,
  },
  COURSES_3: {
    id: 'COURSES_3',
    title: 'Полиглот знаний',
    description: 'Завершите 3 курса',
    icon: '📚',
    xpReward: 500,
    condition: (stats) => stats.completedCourses >= 3,
  },
  STREAK_3: {
    id: 'STREAK_3',
    title: 'Три дня подряд',
    description: 'Учитесь 3 дня подряд',
    icon: '🌟',
    xpReward: 60,
    condition: (stats) => stats.currentStreak >= 3,
  },
  STREAK_7: {
    id: 'STREAK_7',
    title: 'Неделя без пропусков',
    description: 'Учитесь 7 дней подряд',
    icon: '🔆',
    xpReward: 150,
    condition: (stats) => stats.currentStreak >= 7,
  },
  STREAK_30: {
    id: 'STREAK_30',
    title: 'Месяц упорства',
    description: 'Учитесь 30 дней подряд',
    icon: '💎',
    xpReward: 500,
    condition: (stats) => stats.currentStreak >= 30,
  },
};

/**
 * Calculate level from total XP.
 * Level 1 starts at 0 XP.
 * Each level requires 20% more XP than the previous (base 100).
 * Level n requires: 100 * (1.2^(n-1)) XP from start of that level.
 */
export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  let level = 1;
  let xpAccumulated = 0;
  let required = 100;
  while (xp >= xpAccumulated + required) {
    xpAccumulated += required;
    level++;
    required = Math.floor(required * 1.2);
  }
  return level;
}

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  requiredXp: number;
  percent: number;
}

/**
 * Returns level info: current level, XP within this level, XP needed for next level, progress %.
 */
export function xpForNextLevel(currentXp: number): LevelInfo {
  if (currentXp <= 0) {
    return { level: 1, currentLevelXp: 0, requiredXp: 100, percent: 0 };
  }
  let level = 1;
  let xpAccumulated = 0;
  let required = 100;
  while (currentXp >= xpAccumulated + required) {
    xpAccumulated += required;
    level++;
    required = Math.floor(required * 1.2);
  }
  const currentLevelXp = currentXp - xpAccumulated;
  const percent = Math.floor((currentLevelXp / required) * 100);
  return { level, currentLevelXp, requiredXp: required, percent };
}

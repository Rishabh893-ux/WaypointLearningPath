export type BadgeContext = {
  messageCount: number;
  completedCourses: number;
  passedAssessments: number;
  hasPerfectScore: boolean;
  manualAdds: number;
  milestonesCompleted: number;
  streakCount: number;
  longestStreak: number;
  roadmapComplete: boolean;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (ctx: BadgeContext) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: "first-message",
    title: "Getting Started",
    description: "Told the advisor what you want to learn",
    icon: "◆",
    check: (ctx) => ctx.messageCount >= 1,
  },
  {
    id: "first-assessment-pass",
    title: "Verified",
    description: "Passed your first course assessment",
    icon: "✓",
    check: (ctx) => ctx.passedAssessments >= 1,
  },
  {
    id: "perfect-score",
    title: "Perfectionist",
    description: "Scored 100% on an assessment",
    icon: "★",
    check: (ctx) => ctx.hasPerfectScore,
  },
  {
    id: "five-passed",
    title: "Scholar",
    description: "Passed five course assessments",
    icon: "▲",
    check: (ctx) => ctx.passedAssessments >= 5,
  },
  {
    id: "milestone-1",
    title: "First Milestone",
    description: "Completed an entire milestone",
    icon: "⬡",
    check: (ctx) => ctx.milestonesCompleted >= 1,
  },
  {
    id: "streak-3",
    title: "On a Roll",
    description: "3-day study streak",
    icon: "🔥",
    check: (ctx) => ctx.streakCount >= 3 || ctx.longestStreak >= 3,
  },
  {
    id: "streak-7",
    title: "Committed",
    description: "7-day study streak",
    icon: "🔥",
    check: (ctx) => ctx.streakCount >= 7 || ctx.longestStreak >= 7,
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Added a course yourself from the catalog",
    icon: "⌖",
    check: (ctx) => ctx.manualAdds >= 1,
  },
  {
    id: "roadmap-complete",
    title: "Waypoint Reached",
    description: "Completed every course in your roadmap",
    icon: "◈",
    check: (ctx) => ctx.roadmapComplete,
  },
];

export function computeXp(ctx: BadgeContext) {
  return (
    ctx.completedCourses * 100 +
    ctx.passedAssessments * 50 +
    ctx.manualAdds * 10 +
    Math.min(ctx.messageCount, 20) * 2
  );
}

export function levelFromXp(xp: number) {
  const xpPerLevel = 250;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const xpIntoLevel = xp % xpPerLevel;
  return { level, xpIntoLevel, xpForNextLevel: xpPerLevel };
}

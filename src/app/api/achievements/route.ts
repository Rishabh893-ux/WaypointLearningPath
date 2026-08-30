import { NextResponse } from "next/server";
import { getOrCreateLearner, getLearningPath, getMessages, getFeedback, getAllAssessmentAttempts } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { BADGES, computeXp, levelFromXp, type BadgeContext } from "@/lib/achievements";

function toDateStr(iso: string) {
  return iso.slice(0, 10);
}

function computeStreak(dates: string[]) {
  const unique = Array.from(new Set(dates)).sort();
  if (unique.length === 0) return { streakCount: 0, longestStreak: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      run += 1;
    } else if (diffDays > 1) {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastActive = unique[unique.length - 1];

  let current = 0;
  if (lastActive === today || lastActive === yesterday) {
    current = 1;
    for (let i = unique.length - 1; i > 0; i--) {
      const diffDays = Math.round(
        (new Date(unique[i]).getTime() - new Date(unique[i - 1]).getTime()) / 86400000
      );
      if (diffDays === 1) current += 1;
      else break;
    }
  }

  return { streakCount: current, longestStreak: longest };
}

export async function GET() {
  const learnerId = await getLearnerId();
  const learner = getOrCreateLearner(learnerId);
  const path = getLearningPath(learnerId);
  const messages = getMessages(learnerId);
  const feedback = getFeedback(learnerId);
  const attempts = getAllAssessmentAttempts(learnerId);

  const activityDates = [
    ...messages.map((m) => toDateStr(m.createdAt)),
    ...feedback.map((f) => toDateStr(f.createdAt)),
  ];
  const { streakCount, longestStreak } = computeStreak(activityDates);

  const milestoneGroups: Record<string, { total: number; completed: number }> = {};
  for (const r of path) {
    milestoneGroups[r.milestone] ??= { total: 0, completed: 0 };
    milestoneGroups[r.milestone].total += 1;
    if (r.status === "completed") milestoneGroups[r.milestone].completed += 1;
  }
  const milestonesCompleted = Object.values(milestoneGroups).filter((m) => m.total > 0 && m.completed === m.total).length;

  const ctx: BadgeContext = {
    messageCount: messages.length,
    completedCourses: path.filter((r) => r.status === "completed").length,
    passedAssessments: attempts.filter((a) => a.passed === true).length,
    hasPerfectScore: attempts.some((a) => a.score === 1),
    manualAdds: path.filter((r) => r.source === "manual").length,
    milestonesCompleted,
    streakCount,
    longestStreak,
    roadmapComplete: path.length > 0 && path.every((r) => r.status === "completed"),
  };

  const xp = computeXp(ctx);
  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(xp);

  const badges = BADGES.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    icon: b.icon,
    unlocked: b.check(ctx),
  }));

  return NextResponse.json({
    xp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    streakCount,
    longestStreak,
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalBadges: badges.length,
  });
}

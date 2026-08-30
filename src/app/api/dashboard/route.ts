import { NextResponse } from "next/server";
import { getLearningPath } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { getCourse } from "@/lib/courses";

export async function GET() {
  const learnerId = await getLearnerId();
  const pathRows = getLearningPath(learnerId);

  const totalHrs = pathRows.reduce((sum, r) => sum + (getCourse(r.courseId)?.durationHrs ?? 0), 0);
  const completedHrs = pathRows
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (getCourse(r.courseId)?.durationHrs ?? 0), 0);

  const domainCoverage: Record<string, { total: number; completed: number }> = {};
  for (const r of pathRows) {
    const c = getCourse(r.courseId);
    if (!c) continue;
    domainCoverage[c.domain] ??= { total: 0, completed: 0 };
    domainCoverage[c.domain].total += 1;
    if (r.status === "completed") domainCoverage[c.domain].completed += 1;
  }

  const skillRadar = Object.entries(domainCoverage).map(([domain, v]) => ({
    domain,
    coverage: v.total === 0 ? 0 : Math.round((v.completed / v.total) * 100),
  }));

  const nextActions = pathRows
    .filter((r) => r.status === "planned" || r.status === "in_progress")
    .slice(0, 3)
    .map((r) => ({ courseId: r.courseId, title: getCourse(r.courseId)?.title, milestone: r.milestone }));

  const milestoneMap: Record<string, { total: number; completed: number }> = {};
  for (const r of pathRows) {
    milestoneMap[r.milestone] ??= { total: 0, completed: 0 };
    milestoneMap[r.milestone].total += 1;
    if (r.status === "completed") milestoneMap[r.milestone].completed += 1;
  }
  const milestones = Object.entries(milestoneMap)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([milestone, v]) => ({
      milestone,
      total: v.total,
      completed: v.completed,
      done: v.completed === v.total,
    }));

  return NextResponse.json({
    totalCourses: pathRows.length,
    completedCourses: pathRows.filter((r) => r.status === "completed").length,
    totalHrs,
    completedHrs,
    skillRadar,
    nextActions,
    milestones,
  });
}

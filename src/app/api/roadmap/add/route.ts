import { NextRequest, NextResponse } from "next/server";
import { getOrCreateLearner, getLearningPath, replaceLearningPath } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { getCourse, insertManualCourse, scoreCourse, extractTagsFromText, allTags } from "@/lib/courses";

export async function POST(req: NextRequest) {
  const { courseId } = await req.json();
  const course = getCourse(courseId);
  if (!course) return NextResponse.json({ error: "unknown course" }, { status: 404 });

  const learnerId = await getLearnerId();
  const learner = getOrCreateLearner(learnerId);
  const existingRows = getLearningPath(learnerId);
  const existingIds = existingRows.map((r) => r.courseId);

  if (existingIds.includes(courseId)) {
    return NextResponse.json({ error: "already in roadmap" }, { status: 400 });
  }

  const ordered = insertManualCourse(existingIds, courseId, learner.completedCourseIds);
  const goalTags = learner.goal ? extractTagsFromText(learner.goal, allTags()) : learner.interests;

  const milestoneSize = 2;
  const items = ordered.map((c, i) => {
    const prior = existingRows.find((r) => r.courseId === c.id);
    if (prior) {
      return {
        courseId: c.id,
        position: i,
        milestone: `Milestone ${Math.floor(i / milestoneSize) + 1}`,
        score: prior.score,
        explanation: prior.explanation,
        source: prior.source,
        status: prior.status,
      };
    }
    const { score } = scoreCourse(c, goalTags, learner.interests, learner.completedCourseIds);
    const isTheAddedCourse = c.id === courseId;
    return {
      courseId: c.id,
      position: i,
      milestone: `Milestone ${Math.floor(i / milestoneSize) + 1}`,
      score,
      explanation: isTheAddedCourse
        ? "Added manually from the course explorer."
        : `Required prerequisite for "${course.title}", which you added manually.`,
      source: "manual" as const,
      status: "planned" as const,
    };
  });

  const rows = replaceLearningPath(learnerId, items);
  return NextResponse.json({ path: rows.map((r) => ({ ...r, course: getCourse(r.courseId) })) });
}

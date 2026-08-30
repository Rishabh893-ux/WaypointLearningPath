import { NextResponse } from "next/server";
import { getOrCreateLearner, getLearningPath } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { loadCourses, scoreCourse, extractTagsFromText, allTags } from "@/lib/courses";

export async function GET() {
  const learnerId = await getLearnerId();
  const learner = getOrCreateLearner(learnerId);
  const path = getLearningPath(learnerId);
  const inRoadmap = new Set(path.map((p) => p.courseId));

  const goalTags = learner.goal ? extractTagsFromText(learner.goal, allTags()) : learner.interests;

  const courses = loadCourses().map((c) => {
    const { score } = scoreCourse(c, goalTags, learner.interests, learner.completedCourseIds);
    return {
      ...c,
      inRoadmap: inRoadmap.has(c.id),
      completed: learner.completedCourseIds.includes(c.id),
      matchPct: Math.round(score * 100),
    };
  });

  return NextResponse.json({ courses });
}
